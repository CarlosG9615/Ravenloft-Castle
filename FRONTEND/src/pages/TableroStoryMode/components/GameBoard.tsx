import { useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Group, Layer, Rect, Stage, Text, Image as KonvaImage } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import useImage from 'use-image';
import type { MapConfig } from '../hooks/useBoardGrid';
import { useBoardGrid } from '../hooks/useBoardGrid';
import './GameBoard.css';

// Suprimir errores de canvas de use-image (son warnings, no críticos)
const originalError = console.error;
const suppressDrawImageErrors = (...args: any[]) => {
  const errorMsg = String(args[0] || '');
  // Solo suprimir errores específicos de drawImage que no rompen la funcionalidad
  if (errorMsg.includes('drawImage') && errorMsg.includes('width or height of 0')) {
    return;
  }
  originalError.apply(console, args);
};
console.error = suppressDrawImageErrors as any;

export interface BoardToken {
  id: string;
  col: number;
  row: number;
  color: string;
  initials: string;
  avatarUrl?: string;
  movement: number;
}

interface GameBoardProps {
  mapConfig: MapConfig;
  tokens: BoardToken[];
  onTokenMove?: (id: string, col: number, row: number) => void;
  jugadores?: any[];
  turnoActual?: { turnoActualPersonajeId: string | number | null; fase: 'personajes' | 'master' } | null;
  sendFinTurno?: (personajeId: string | number) => void;
  jugadorActual?: any;
  miPersonajeId?: string;
}

interface Size { width: number; height: number; }
interface PanPoint { x: number; y: number; }
type CellPosition = { col: number; row: number };
type TurnSide = 'personajes' | 'master';

interface BoardTokenNodeProps {
  token: BoardToken;
  x: number;
  y: number;
  radius: number;
  selected: boolean;
  disabled: boolean;
  draggable: boolean;
  isCurrentTurn?: boolean;
  onSelect: () => void;
  onPointerDown: (event: KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

function BoardTokenNode({ token, x, y, radius, selected, disabled, draggable, isCurrentTurn = false, onSelect, onPointerDown }: BoardTokenNodeProps) {
  // Solo cargar imagen si la URL es válida y no vacía
  const validAvatarUrl = token.avatarUrl && token.avatarUrl.trim() && /^(https?:\/\/|\/|data:)/.test(token.avatarUrl) ? token.avatarUrl : null;
  // Solo llamar a useImage si tenemos una URL válida
  const [avatarImage] = useImage(validAvatarUrl || '');
  const [avatarImageReady, setAvatarImageReady] = useState(false);
  
  // Detectar cuando la imagen del avatar está lista
  useEffect(() => {
    if (validAvatarUrl && avatarImage && avatarImage.width > 0 && avatarImage.height > 0) {
      setAvatarImageReady(true);
    } else {
      setAvatarImageReady(false);
    }
  }, [avatarImage, validAvatarUrl]);
  
  const avatarZoom = 1.75;
  const avatarVisibleDiameter = radius * 2 - 4;
  const avatarRenderSize = avatarVisibleDiameter * avatarZoom;
  const activeBorderColor = 'white';

  return (
    <Group
      x={x}
      y={y}
      onClick={() => { if (!disabled) onSelect(); }}
      onTap={() => { if (!disabled) onSelect(); }}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      opacity={disabled ? 0.72 : 1}
      draggable={false}
      listening
      // Solo mostrar mano/puntero cuando el token es realmente interactivo para mover.
      cursor={draggable ? 'grab' : 'default'}
    >
      <Circle
        radius={radius}
        fill="rgba(255,255,255,0.05)"
        stroke={token.color}
        strokeWidth={2}
        shadowColor="rgba(0, 0, 0, 0.45)"
        shadowBlur={8}
      />
      {selected && !isCurrentTurn && (
        <Circle
          radius={radius + 3}
          fillEnabled={false}
          stroke="white"
          strokeWidth={2}
          listening={false}
        />
      )}
      {isCurrentTurn && (
        <Circle
          radius={radius + 7}
          fillEnabled={false}
          stroke={activeBorderColor}
          strokeWidth={3}
          shadowColor={activeBorderColor}
          shadowBlur={10}
          listening={false}
        />
      )}
      {avatarImageReady && avatarImage && (
        <Group
          clipFunc={(ctx) => {
            ctx.beginPath();
            ctx.arc(0, 0, radius - 1.5, 0, Math.PI * 2, true);
            ctx.closePath();
          }}
          listening={false}
        >
          <KonvaImage
            image={avatarImage}
            x={-avatarRenderSize / 2}
            y={-avatarRenderSize / 2}
            width={avatarRenderSize}
            height={avatarRenderSize}
          />
        </Group>
      )}
      {!avatarImageReady && (
        <Text
          x={-radius}
          y={-radius + 1}
          width={radius * 2}
          height={radius * 2}
          text={token.initials}
          align="center"
          verticalAlign="middle"
          fontStyle="bold"
          fontSize={Math.max(10, radius * 0.9)}
          fill="#ffffff"
          listening={false}
        />
      )}
    </Group>
  );
}

export function GameBoard({ mapConfig, tokens, onTokenMove, jugadores = [], turnoActual = null, sendFinTurno, jugadorActual = null, miPersonajeId = '' }: GameBoardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ pointerX: number; pointerY: number; originX: number; originY: number } | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Drag state in ref for reliable access in Stage event handlers (avoids stale closures)
  const draggingRef = useRef<{ tokenId: string; originCell: CellPosition; currentCell: CellPosition } | null>(null);

  const [stageSize, setStageSize] = useState<Size>({ width: 1, height: 1 });
  const [mapPan, setMapPan] = useState<PanPoint>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [isPointerOnMap, setIsPointerOnMap] = useState(false);
  const [openTurnModalTokenId, setOpenTurnModalTokenId] = useState<string | null>(null);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(tokens[0]?.id ?? null);
  const [tokenCells, setTokenCells] = useState<Record<string, CellPosition>>(() => {
    const initial: Record<string, CellPosition> = {};
    for (const token of tokens) initial[token.id] = { col: token.col, row: token.row };
    return initial;
  });
  const [dragOriginCell, setDragOriginCell] = useState<CellPosition | null>(null);
  const [dragCurrentCell, setDragCurrentCell] = useState<CellPosition | null>(null);
  const [animatingTokenId, setAnimatingTokenId] = useState<string | null>(null);
  const [animPath, setAnimPath] = useState<CellPosition[]>([]);
  const [animStep, setAnimStep] = useState(0);
  const [rolledMovement, setRolledMovement] = useState<number | null>(null);
  const [mapImageReady, setMapImageReady] = useState(false);

  // Estados del turno provienen del WebSocket
  const activeTurn = turnoActual?.fase ?? 'personajes';
  const currentTurnTokenId = turnoActual?.turnoActualPersonajeId?.toString() ?? null;

  const [mapImage] = useImage(mapConfig.imageUrl);
  const { pixelToCell, cellToPixel, getReachableCells } = useBoardGrid(mapConfig);

  // Detectar cuando la imagen del mapa está lista
  useEffect(() => {
    if (mapImage && mapImage.width > 0 && mapImage.height > 0) {
      setMapImageReady(true);
    } else {
      setMapImageReady(false);
    }
  }, [mapImage]);

  useEffect(() => {
    return () => { if (animTimerRef.current) clearTimeout(animTimerRef.current); };
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const updateSize = () => setStageSize({ width: Math.max(1, wrapper.clientWidth), height: Math.max(1, wrapper.clientHeight) });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const next: Record<string, CellPosition> = {};
    for (const token of tokens) next[token.id] = { col: token.col, row: token.row };
    setTokenCells(next);
  }, [tokens]);

  // Filtrar tokens solo de jugadores conectados para turnos
  const tokensActivos = useMemo(() => {
    return tokens.filter((token) => {
      if (jugadores.length === 0) return true; // Si no hay info de jugadores, mostrar todos
      // Buscar si existe un jugador conectado para este token
      return jugadores.some((j) =>
        j && (
          j.id?.toString() === token.id ||
          j.usuario_id?.toString() === token.id ||
          (j.nombre && token.initials === j.nombre.slice(0, 2).toUpperCase())
        ) &&
        j.conectado !== false
      );
    });
  }, [tokens, jugadores]);

  // Derivar turnos agotados desde el estado sincronizado para que ambos clientes vean lo mismo.
  const endedTurnIds = useMemo(() => {
    const ended = new Set<string>();
    const orderedTurnTokens = tokensActivos.length > 0 ? tokensActivos : tokens;

    if (activeTurn === 'master') {
      orderedTurnTokens.forEach((t) => ended.add(t.id));
      return ended;
    }

    if (activeTurn !== 'personajes' || !currentTurnTokenId) return ended;

    const currentIndex = orderedTurnTokens.findIndex((t) => t.id === currentTurnTokenId);
    if (currentIndex <= 0) return ended;

    for (let i = 0; i < currentIndex; i++) {
      ended.add(orderedTurnTokens[i].id);
    }

    return ended;
  }, [tokens, tokensActivos, activeTurn, currentTurnTokenId]);

  useEffect(() => {
    if (tokens.length > 0 && !tokens.some((t) => t.id === selectedTokenId)) {
      setSelectedTokenId(tokens[0].id);
    }
    // Si hay un token actualmente en turno, seleccionarlo automáticamente
    if (currentTurnTokenId) {
      setSelectedTokenId(currentTurnTokenId);
    }
  }, [tokens, selectedTokenId, currentTurnTokenId]);

  // Tirada de 2d6 automática al inicio de cada turno de personaje
  useEffect(() => {
    if (activeTurn !== 'personajes') { setRolledMovement(null); return; }
    // Si es el turno de este jugador, haz la tirada
    if (currentTurnTokenId === jugadorActual?.id?.toString() || currentTurnTokenId === jugadorActual?.personajeId?.toString()) {
      const roll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
      setRolledMovement(roll);
    } else {
      setRolledMovement(null);
    }
  }, [currentTurnTokenId, activeTurn, jugadorActual]);

  const fitScale = Math.min(stageSize.width / mapConfig.naturalWidth, stageSize.height / mapConfig.naturalHeight);
  const renderScale = fitScale * 0.85;
  const mapRenderWidth = mapConfig.naturalWidth * renderScale;
  const mapRenderHeight = mapConfig.naturalHeight * renderScale;
  const mapOriginX = (stageSize.width - mapRenderWidth) / 2 + mapPan.x;
  const mapOriginY = (stageSize.height - mapRenderHeight) / 2 + mapPan.y;
  const overlayShiftX = -4;
  const cellSide = mapConfig.cellSize * renderScale;
  const tokenRadius = Math.max(9, mapConfig.cellSize * renderScale * 0.32);

  const currentTurnToken = tokens.find((t) => t.id === currentTurnTokenId) ?? null;
  const allTurnsEnded = activeTurn === 'master';
  const isCurrentTurnTokenMine = Boolean(
    currentTurnTokenId && (currentTurnTokenId === miPersonajeId || currentTurnTokenId === jugadorActual?.id?.toString())
  );

  // ── Helpers ──────────────────────────────────────────────────────────────

  const buildPath = (from: CellPosition, to: CellPosition): CellPosition[] => {
    const path: CellPosition[] = [from];
    if (from.col === to.col) {
      const dir = to.row > from.row ? 1 : -1;
      for (let r = from.row + dir; r !== to.row + dir; r += dir) path.push({ col: from.col, row: r });
    } else {
      const dir = to.col > from.col ? 1 : -1;
      for (let c = from.col + dir; c !== to.col + dir; c += dir) path.push({ col: c, row: from.row });
    }
    return path;
  };

  const constrainToAxis = (origin: CellPosition, hover: CellPosition): CellPosition => {
    const dCol = Math.abs(hover.col - origin.col);
    const dRow = Math.abs(hover.row - origin.row);
    return dCol >= dRow ? { col: hover.col, row: origin.row } : { col: origin.col, row: hover.row };
  };

  const clampToReachable = (origin: CellPosition, target: CellPosition, reachableSet: Set<string>, occupiedKeys: Set<string>): CellPosition => {
    const path = buildPath(origin, target);
    let last = origin;
    for (const cell of path.slice(1)) {
      const key = `${cell.col},${cell.row}`;
      if (!reachableSet.has(key)) break;
      if (!occupiedKeys.has(key)) last = cell; // can pass through occupied but not land on them
    }
    return last;
  };

  const isPointerInsideMap = (x: number, y: number): boolean => (
    x >= mapOriginX &&
    x <= mapOriginX + mapRenderWidth &&
    y >= mapOriginY &&
    y <= mapOriginY + mapRenderHeight
  );

  // ── Overlay cells: all traversed cells with step numbers ─────────────────

  type OverlayEntry = { cell: CellPosition; step: number };
  let overlayCells: OverlayEntry[] = [];

  if (dragCurrentCell && dragOriginCell) {
    const path = buildPath(dragOriginCell, dragCurrentCell);
    overlayCells = path.slice(1).map((cell, i) => ({ cell, step: i + 1 }));
  } else if (animatingTokenId && animPath.length > 0 && animStep > 0) {
    overlayCells = animPath.slice(1, animStep + 1).map((cell, i) => ({ cell, step: i + 1 }));
  }

  // ── Animation ─────────────────────────────────────────────────────────────

  const startAnimation = (tokenId: string, path: CellPosition[]) => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setAnimatingTokenId(tokenId);
    setAnimPath(path);
    setAnimStep(0);
    setTokenCells(prev => ({ ...prev, [tokenId]: path[0] }));

    let step = 0;
    const advance = () => {
      step++;
      if (step >= path.length) {
        const to = path[path.length - 1];
        setAnimatingTokenId(null);
        setAnimPath([]);
        setAnimStep(0);
        onTokenMove?.(tokenId, to.col, to.row);
        return;
      }
      setTokenCells(prev => ({ ...prev, [tokenId]: path[step] }));
      setAnimStep(step);
      animTimerRef.current = setTimeout(advance, 220);
    };
    advance();
  };

  // ── Stage event handlers ──────────────────────────────────────────────────

  const handleStagePointerDown = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (draggingRef.current) return;
    const className = event.target.getClassName();
    if (className !== 'Stage' && className !== 'Image') return;
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    if (!isPointerInsideMap(pointer.x, pointer.y)) return;
    panStartRef.current = { pointerX: pointer.x, pointerY: pointer.y, originX: mapPan.x, originY: mapPan.y };
    setIsPanning(true);
  };

  const handleStagePointerMove = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) return;
    setIsPointerOnMap(isPointerInsideMap(pointer.x, pointer.y));

    if (draggingRef.current) {
      const { originCell, tokenId } = draggingRef.current;
      const token = tokens.find(t => t.id === tokenId);
      if (!token) return;
      const localX = pointer.x - mapOriginX;
      const localY = pointer.y - mapOriginY;
      const raw = pixelToCell(localX, localY, renderScale);
      if (!raw) return;
      const constrained = constrainToAxis(originCell, raw);
      // Compute reachable from origin using the rolled movement (avoids stale closure issue)
      const localReachable = getReachableCells(originCell.col, originCell.row, rolledMovement ?? 0);
      const occupiedKeys = new Set<string>(
        tokens
          .filter(t => t.id !== tokenId)
          .flatMap(t => {
            const cell = tokenCells[t.id];
            return cell ? [`${cell.col},${cell.row}`] : [];
          })
      );
      const clamped = clampToReachable(originCell, constrained, localReachable, occupiedKeys);
      draggingRef.current.currentCell = clamped;
      const isSameAsOrigin = clamped.col === originCell.col && clamped.row === originCell.row;
      setDragCurrentCell(isSameAsOrigin ? null : clamped);
      return;
    }

    if (!isPanning || !panStartRef.current) return;
    const deltaX = pointer.x - panStartRef.current.pointerX;
    const deltaY = pointer.y - panStartRef.current.pointerY;
    setMapPan({ x: panStartRef.current.originX + deltaX, y: panStartRef.current.originY + deltaY });
  };

  const handleStagePointerUp = () => {
    if (draggingRef.current) {
      const { tokenId, originCell, currentCell } = draggingRef.current;
      draggingRef.current = null;
      setDragCurrentCell(null);
      setDragOriginCell(null);
      const moved = !(currentCell.col === originCell.col && currentCell.row === originCell.row);
      if (moved) startAnimation(tokenId, buildPath(originCell, currentCell));
      return;
    }
    panStartRef.current = null;
    setIsPanning(false);
  };

  // ── Turn management ───────────────────────────────────────────────────────

  const resetCharacterTurns = () => {
    // Reset solo limpia la UI local; el servidor maneja el turno actual
    setOpenTurnModalTokenId(null);
    if (tokens.length > 0) setSelectedTokenId(tokens[0].id);
  };

  const handleTurnTab = (side: TurnSide) => {
    if (side === 'personajes') {
      if (activeTurn === 'personajes' && !allTurnsEnded) return;
      resetCharacterTurns();
      return;
    }
    // El flujo a turno de master lo controla el servidor cuando todos agotan turno.
    if (!allTurnsEnded) return;
    setOpenTurnModalTokenId(null);
  };

  const handleAvatarClick = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    if (activeTurn === 'personajes' && tokenId === currentTurnTokenId && !isCurrentTurnTokenMine) {
      return;
    }
    setOpenTurnModalTokenId((prev) => (prev === tokenId ? null : tokenId));
  };

  const finalizeTurn = (tokenId: string) => {
    if (activeTurn !== 'personajes') return;
    if (currentTurnTokenId !== tokenId.toString()) return;
    setOpenTurnModalTokenId(null);
    // Enviar al servidor para que calcule el siguiente turno
    sendFinTurno?.(tokenId);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={wrapperRef} className="gb-stage-wrap">
      <div className="gb-top-tab">
        <h3 className="gb-top-title">Ravenloft Castle</h3>

        <div className="gb-top-avatars" aria-label="Personajes en partida">
          {tokens.map((token) => {
            const isCurrent = token.id === currentTurnTokenId;
            const ended = endedTurnIds.has(token.id);
            const isFixedWaitingModal = activeTurn === 'personajes' && isCurrent && !isCurrentTurnTokenMine;
            const showModal = openTurnModalTokenId === token.id || isFixedWaitingModal;
            return (
              <div key={`top-${token.id}`} className="gb-top-avatar-wrap">
                <button
                  type="button"
                  className={`gb-top-avatar ${selectedTokenId === token.id ? 'active' : ''} ${isCurrent && activeTurn === 'personajes' ? 'current' : ''} ${ended ? 'ended' : ''}`}
                  style={{
                    borderColor: token.color,
                    backgroundImage: token.avatarUrl ? `url(${token.avatarUrl})` : undefined,
                    boxShadow: isCurrent && activeTurn === 'personajes'
                      ? '0 0 0 3px rgba(123, 36, 35, 0.95), 0 0 10px rgba(123, 36, 35, 0.55)'
                      : (selectedTokenId === token.id ? `0 0 0 2px ${token.color}55` : undefined)
                  }}
                  title={token.initials}
                  onClick={() => handleAvatarClick(token.id)}
                >
                  {!token.avatarUrl ? token.initials : null}
                </button>
                {showModal && (
                  <div className="gb-turn-modal" role="dialog" aria-label="Finalizar turno">
                    {activeTurn === 'master' && <p className="gb-turn-modal-text">Ahora mismo el master está resolviendo sus jugadas.</p>}
                    {activeTurn === 'personajes' && isCurrent && token.id === miPersonajeId && (
                      <>
                        <p className="gb-turn-modal-text">¿Quieres finalizar el turno de este personaje?</p>
                        <button type="button" className="gb-turn-finalize-btn" onClick={() => finalizeTurn(token.id)}>
                          Finalizar turno
                        </button>
                      </>
                    )}
                    {activeTurn === 'personajes' && isCurrent && token.id !== miPersonajeId && (
                      <div className="gb-turn-modal-waiting">
                        <p className="gb-turn-modal-text">Esperando a que finalice su turno...</p>
                        <div className="gb-turn-waiting-loader" aria-label="Esperando fin de turno" />
                      </div>
                    )}
                    {activeTurn === 'personajes' && !isCurrent && <p className="gb-turn-modal-text">Todavía no le toca. Espera su turno.</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {activeTurn === 'personajes' && rolledMovement !== null && (
          <div className="gb-movement-roll">
            <span className="gb-movement-dice">🎲🎲</span>
            <span className="gb-movement-valor">{rolledMovement}</span>
            <span className="gb-movement-label">casillas de movimiento</span>
          </div>
        )}

        <div className="gb-turn-tabs">
          <button
            type="button"
            className={`gb-turn-btn ${activeTurn === 'personajes' ? 'active' : ''} ${activeTurn === 'master' ? 'disabled' : ''}`}
            onClick={() => handleTurnTab('personajes')}
            disabled={activeTurn === 'master'}
          >
            Turno de personajes
          </button>
          <button
            type="button"
            className={`gb-turn-btn ${activeTurn === 'master' ? 'active master' : ''}`}
            onClick={() => handleTurnTab('master')}
            disabled={activeTurn !== 'master'}
          >
            Turno del master
          </button>
        </div>

        {activeTurn === 'master' && (
          <div className="gb-master-box">
            <p className="gb-master-text">El master está resolviendo sus jugadas</p>
            <div className="gb-master-loader" aria-label="Cargando jugadas del master">
              <span className="dot d1" /><span className="dot d2" /><span className="dot d3" /><span className="dot d4" />
              <span className="dot d5" /><span className="dot d6" /><span className="dot d7" /><span className="dot d8" />
            </div>
          </div>
        )}
      </div>

      <Stage
        width={stageSize.width}
        height={stageSize.height}
        className={`gb-stage ${isPanning || dragOriginCell !== null ? 'grabbing' : ''} ${!isPanning && dragOriginCell === null && isPointerOnMap ? 'map-hover' : ''}`}
        onMouseDown={handleStagePointerDown}
        onTouchStart={handleStagePointerDown}
        onMouseMove={handleStagePointerMove}
        onTouchMove={handleStagePointerMove}
        onMouseUp={handleStagePointerUp}
        onMouseLeave={handleStagePointerUp}
        onTouchEnd={handleStagePointerUp}
      >
        {/* Layer 1: mapa */}
        <Layer listening={false}>
          <Group x={mapOriginX} y={mapOriginY} scaleX={renderScale} scaleY={renderScale}>
            {mapImageReady && mapImage && (
              <KonvaImage image={mapImage} x={0} y={0} width={mapConfig.naturalWidth} height={mapConfig.naturalHeight} />
            )}
          </Group>
        </Layer>

        {/* Layer 2: tokens (sin drag nativo — posición controlada por React state) */}
        <Layer>
          {tokens.map((token) => {
            const tokenCell = tokenCells[token.id];
            if (!tokenCell) return null;
            const tokenPixel = cellToPixel(tokenCell.col, tokenCell.row);
            const tokenX = mapOriginX + tokenPixel.x * renderScale;
            const tokenY = mapOriginY + tokenPixel.y * renderScale;
            const ended = endedTurnIds.has(token.id);
            const canDrag = activeTurn === 'personajes' && token.id === currentTurnTokenId && !ended && animatingTokenId === null;

            return (
              <BoardTokenNode
                key={token.id}
                token={token}
                x={tokenX}
                y={tokenY}
                radius={tokenRadius}
                selected={selectedTokenId === token.id}
                disabled={ended || activeTurn === 'master'}
                draggable={canDrag}
                isCurrentTurn={token.id === currentTurnTokenId && activeTurn === 'personajes'}
                onSelect={() => { if (animatingTokenId === null) setSelectedTokenId(token.id); }}
                onPointerDown={(event) => {
                  event.cancelBubble = true;
                  if (!canDrag) {
                    if (animatingTokenId === null) setSelectedTokenId(token.id);
                    return;
                  }
                  const origin = tokenCells[token.id];
                  if (!origin) return;
                  setSelectedTokenId(token.id);
                  setDragOriginCell(origin);
                  setDragCurrentCell(null);
                  draggingRef.current = { tokenId: token.id, originCell: origin, currentCell: origin };
                }}
              />
            );
          })}
        </Layer>

        {/* Layer 3: overlay de movimiento (encima de los tokens para que los números sean visibles) */}
        <Layer listening={false}>
          {overlayCells.map(({ cell, step }) => {
            const cellX = mapOriginX + (mapConfig.offsetX + cell.col * mapConfig.cellSize) * renderScale;
            const cellY = mapOriginY + (mapConfig.offsetY + cell.row * mapConfig.cellSize) * renderScale;
            return (
              <Group key={`ov-${cell.col}-${cell.row}`}>
                <Rect
                  x={cellX + overlayShiftX}
                  y={cellY}
                  width={cellSide}
                  height={cellSide}
                  fill="rgba(255, 204, 0, 0.45)"
                  stroke="rgba(255, 220, 120, 0.9)"
                  strokeWidth={1.5}
                />
                <Text
                  x={cellX + overlayShiftX}
                  y={cellY}
                  width={cellSide}
                  height={cellSide}
                  text={step.toString()}
                  align="center"
                  verticalAlign="middle"
                  fontStyle="bold"
                  fontSize={Math.max(12, cellSide * 0.42)}
                  fill="#ffffff"
                  shadowColor="rgba(0,0,0,0.85)"
                  shadowBlur={4}
                  shadowOffsetX={1}
                  shadowOffsetY={1}
                />
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
}
