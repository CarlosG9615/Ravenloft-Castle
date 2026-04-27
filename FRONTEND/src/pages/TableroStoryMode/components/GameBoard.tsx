import { useEffect, useRef, useState } from 'react';
import { Circle, Group, Layer, Rect, Stage, Text, Image as KonvaImage } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import useImage from 'use-image';
import type { MapConfig } from '../hooks/useBoardGrid';
import { useBoardGrid } from '../hooks/useBoardGrid';
import './GameBoard.css';

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
  onSelect: () => void;
  onPointerDown: (event: KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

function BoardTokenNode({ token, x, y, radius, selected, disabled, onSelect, onPointerDown }: BoardTokenNodeProps) {
  const [avatarImage] = useImage(token.avatarUrl ?? '');
  const avatarZoom = 1.75;
  const avatarVisibleDiameter = radius * 2 - 4;
  const avatarRenderSize = avatarVisibleDiameter * avatarZoom;

  return (
    <Group
      x={x}
      y={y}
      onClick={() => { if (!disabled) onSelect(); }}
      onTap={() => { if (!disabled) onSelect(); }}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      opacity={disabled ? 0.42 : 1}
    >
      <Circle
        radius={radius}
        fill="rgba(255,255,255,0.05)"
        stroke={token.color}
        strokeWidth={2}
        shadowColor="rgba(0, 0, 0, 0.45)"
        shadowBlur={8}
      />
      {selected && (
        <Circle
          radius={radius + 3}
          fillEnabled={false}
          stroke="rgba(255, 225, 107, 0.9)"
          strokeWidth={2}
          listening={false}
        />
      )}
      {avatarImage && (
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
      {!avatarImage && (
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

export function GameBoard({ mapConfig, tokens, onTokenMove }: GameBoardProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ pointerX: number; pointerY: number; originX: number; originY: number } | null>(null);
  const animTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Drag state in ref for reliable access in Stage event handlers (avoids stale closures)
  const draggingRef = useRef<{ tokenId: string; originCell: CellPosition; currentCell: CellPosition } | null>(null);

  const [stageSize, setStageSize] = useState<Size>({ width: 1, height: 1 });
  const [mapPan, setMapPan] = useState<PanPoint>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [activeTurn, setActiveTurn] = useState<TurnSide>('personajes');
  const [endedTurnIds, setEndedTurnIds] = useState<Set<string>>(new Set());
  const [openTurnModalTokenId, setOpenTurnModalTokenId] = useState<string | null>(null);
  const [showMasterTurnConfirm, setShowMasterTurnConfirm] = useState(false);
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

  const [mapImage] = useImage(mapConfig.imageUrl);
  const { pixelToCell, cellToPixel, getReachableCells } = useBoardGrid(mapConfig);

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

  useEffect(() => {
    if (tokens.length > 0 && !tokens.some((t) => t.id === selectedTokenId)) {
      setSelectedTokenId(tokens[0].id);
    }
  }, [tokens, selectedTokenId]);

  // Tirada de 2d6 automática al inicio de cada turno de personaje.
  // Depende solo de endedTurnIds y activeTurn — NO de tokens,
  // para evitar re-tirar cuando cambian las posiciones tras un movimiento.
  useEffect(() => {
    if (activeTurn !== 'personajes') { setRolledMovement(null); return; }
    // Determinamos el personaje activo sin depender de la referencia de tokens
    const currentId = tokens.find((t) => !endedTurnIds.has(t.id))?.id ?? null;
    if (currentId !== null) {
      const roll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
      setRolledMovement(roll);
    } else {
      setRolledMovement(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endedTurnIds, activeTurn]); // tokens excluido intencionadamente: los IDs son estables

  const fitScale = Math.min(stageSize.width / mapConfig.naturalWidth, stageSize.height / mapConfig.naturalHeight);
  const renderScale = fitScale * 0.85;
  const mapRenderWidth = mapConfig.naturalWidth * renderScale;
  const mapRenderHeight = mapConfig.naturalHeight * renderScale;
  const mapOriginX = (stageSize.width - mapRenderWidth) / 2 + mapPan.x;
  const mapOriginY = (stageSize.height - mapRenderHeight) / 2 + mapPan.y;
  const overlayShiftX = -4;
  const cellSide = mapConfig.cellSize * renderScale;
  const tokenRadius = Math.max(9, mapConfig.cellSize * renderScale * 0.32);

  const currentTurnToken = tokens.find((t) => !endedTurnIds.has(t.id)) ?? null;
  const currentTurnTokenId = currentTurnToken?.id ?? null;
  const allTurnsEnded = tokens.length > 0 && endedTurnIds.size === tokens.length;

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
    panStartRef.current = { pointerX: pointer.x, pointerY: pointer.y, originX: mapPan.x, originY: mapPan.y };
    setIsPanning(true);
  };

  const handleStagePointerMove = (event: KonvaEventObject<MouseEvent | TouchEvent>) => {
    const pointer = event.target.getStage()?.getPointerPosition();
    if (!pointer) return;

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
    setEndedTurnIds(new Set());
    setOpenTurnModalTokenId(null);
    setShowMasterTurnConfirm(false);
    setActiveTurn('personajes');
    if (tokens.length > 0) setSelectedTokenId(tokens[0].id);
  };

  const handleTurnTab = (side: TurnSide) => {
    if (side === 'personajes') {
      if (activeTurn === 'personajes' && !allTurnsEnded) return;
      resetCharacterTurns();
      return;
    }
    if (!allTurnsEnded) { setShowMasterTurnConfirm(true); return; }
    setShowMasterTurnConfirm(false);
    setOpenTurnModalTokenId(null);
    setActiveTurn('master');
  };

  const handleAvatarClick = (tokenId: string) => {
    setSelectedTokenId(tokenId);
    setShowMasterTurnConfirm(false);
    setOpenTurnModalTokenId((prev) => (prev === tokenId ? null : tokenId));
  };

  const finalizeTurn = (tokenId: string) => {
    if (activeTurn !== 'personajes') return;
    if (currentTurnTokenId !== tokenId) return;
    const nextEnded = new Set(endedTurnIds);
    nextEnded.add(tokenId);
    setEndedTurnIds(nextEnded);
    setOpenTurnModalTokenId(null);
    setShowMasterTurnConfirm(false);
    const nextToken = tokens.find((t) => !nextEnded.has(t.id)) ?? null;
    if (!nextToken) { setActiveTurn('master'); return; }
    setSelectedTokenId(nextToken.id);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div ref={wrapperRef} className="gb-stage-wrap" style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
      <div className="gb-top-tab">
        <h3 className="gb-top-title">Ravenloft Castle</h3>

        <div className="gb-top-avatars" aria-label="Personajes en partida">
          {tokens.map((token) => {
            const ended = endedTurnIds.has(token.id);
            const isCurrent = token.id === currentTurnTokenId;
            const showModal = openTurnModalTokenId === token.id;
            return (
              <div key={`top-${token.id}`} className="gb-top-avatar-wrap">
                <button
                  type="button"
                  className={`gb-top-avatar ${selectedTokenId === token.id ? 'active' : ''} ${ended ? 'ended' : ''} ${isCurrent && activeTurn === 'personajes' ? 'current' : ''}`}
                  style={{ borderColor: token.color, backgroundImage: token.avatarUrl ? `url(${token.avatarUrl})` : undefined }}
                  title={token.initials}
                  onClick={() => handleAvatarClick(token.id)}
                >
                  {!token.avatarUrl ? token.initials : null}
                </button>
                {showModal && (
                  <div className="gb-turn-modal" role="dialog" aria-label="Finalizar turno">
                    {activeTurn === 'master' && <p className="gb-turn-modal-text">Ahora mismo el master está resolviendo sus jugadas.</p>}
                    {activeTurn === 'personajes' && ended && <p className="gb-turn-modal-text">Este personaje ya terminó su turno.</p>}
                    {activeTurn === 'personajes' && !ended && !isCurrent && <p className="gb-turn-modal-text">Todavía no le toca. Espera su turno.</p>}
                    {activeTurn === 'personajes' && isCurrent && !ended && (
                      <>
                        <p className="gb-turn-modal-text">¿Quieres finalizar el turno de este personaje?</p>
                        <button type="button" className="gb-turn-finalize-btn" onClick={() => finalizeTurn(token.id)}>
                          Finalizar turno
                        </button>
                      </>
                    )}
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
          <button type="button" className={`gb-turn-btn ${activeTurn === 'personajes' ? 'active' : ''}`} onClick={() => handleTurnTab('personajes')}>
            Turno de personajes
          </button>
          <button type="button" className={`gb-turn-btn ${activeTurn === 'master' ? 'active' : ''}`} onClick={() => handleTurnTab('master')}>
            Turno del master
          </button>
        </div>

        {showMasterTurnConfirm && (
          <div className="gb-master-confirm" role="dialog" aria-label="Confirmar turno del master">
            <p className="gb-master-confirm-text">¿Seguro que queréis pasar al turno del master? Todavía quedan turnos pendientes...</p>
            <button type="button" className="gb-master-confirm-btn" onClick={() => { setShowMasterTurnConfirm(false); setOpenTurnModalTokenId(null); setActiveTurn('master'); }}>
              Confirmar
            </button>
          </div>
        )}

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
        className="gb-stage"
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
            <KonvaImage image={mapImage ?? undefined} x={0} y={0} width={mapConfig.naturalWidth} height={mapConfig.naturalHeight} />
          </Group>
        </Layer>

        {/* Layer 2: tokens (sin drag nativo — posición controlada por React state) */}
        <Layer>
          {tokens.map((token) => {
            const tokenCell = tokenCells[token.id];
            if (!tokenCell) return null;
            const tokenPixel = cellToPixel(tokenCell.col, tokenCell.row, renderScale);
            const tokenX = mapOriginX + tokenPixel.x;
            const tokenY = mapOriginY + tokenPixel.y;
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
