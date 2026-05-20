import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Circle, Group, Layer, Rect, Stage, Text, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';
import { useBoardGrid } from '../TableroStoryMode/hooks/useBoardGrid';
import type { MapConfig } from '../TableroStoryMode/hooks/useBoardGrid';
import './MasterPrepBoard.css';

export interface PlacedEnemy {
  instanciaId: string;
  enemigoId: number;
  nombre: string;
  col: number;
  row: number;
  salud?: number;
}

export interface PlacedTrap {
  instanciaId: string;
  trapId: string;
  nombre: string;
  imageUrl: string;
  col: number;
  row: number;
}

interface MasterPrepBoardProps {
  mapConfig: MapConfig;
  placedEnemies: PlacedEnemy[];
  onEnemyRemove: (instanciaId: string) => void;
  onEnemyMove: (instanciaId: string, col: number, row: number) => void;
  placedTraps: PlacedTrap[];
  onTrapRemove: (instanciaId: string) => void;
  onTrapMove: (instanciaId: string, col: number, row: number) => void;
  isDraggingFromBench: boolean;
  onBlockedMove?: () => void;
  showDebugGrid?: boolean;
}

export type TryDropResult =
  | { ok: true; col: number; row: number }
  | { ok: false; reason: 'blocked' | 'outOfBounds' };

export interface MasterPrepBoardHandle {
  tryDrop: (clientX: number, clientY: number) => TryDropResult;
}

interface Size { width: number; height: number; }
interface CellPos { col: number; row: number; }

const ENEMY_COLOR = '#e03030';
const TRAP_COLOR  = '#e08030';
const TOKEN_RADIUS_FACTOR = 0.38;

function getEnemigoImageKey(nombre: string): string {
  return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
}

function useEnemyImage(nombre: string): HTMLImageElement | undefined {
  const key = getEnemigoImageKey(nombre);
  const [pngImg, pngStatus] = useImage(`/images/enemigos/${key}Enemigo.png`);
  const [jpgImg, jpgStatus] = useImage(`/images/enemigos/${key}Enemigo.jpg`);
  if (pngStatus === 'loaded' && pngImg) return pngImg;
  if (jpgStatus === 'loaded' && jpgImg) return jpgImg;
  return undefined;
}

// Celdas reservadas para el spawn de personajes — no se pueden colocar enemigos
const SPAWN_CELLS = new Set<string>([
  '12,16', '12,17', '12,18', '12,19',
  '13,16', '13,17', '13,18', '13,19',
]);

export const isSpawnCell = (col: number, row: number) => SPAWN_CELLS.has(`${col},${row}`);

// Posiciones de spawn reales (historia1) usadas para calcular rango de visión
const SPAWN_POSITIONS = [
  { col: 12, row: 18 },
  { col: 13, row: 18 },
  { col: 12, row: 19 },
  { col: 13, row: 19 },
];

// Bounding boxes de las salas de historia1
export interface Historia1RoomBounds {
  colStart: number;
  rowStart: number;
  colEnd: number;
  rowEnd: number;
}

export const HISTORIA1_ROOMS: Historia1RoomBounds[] = [
  { colStart: 9,  rowStart: 14, colEnd: 11, rowEnd: 18 },
  { colStart: 14, rowStart: 14, colEnd: 17, rowEnd: 18 },
  { colStart: 5,  rowStart: 10, colEnd:  8, rowEnd: 18 },
  { colStart: 18, rowStart: 15, colEnd: 19, rowEnd: 18 },
  { colStart: 17, rowStart: 10, colEnd: 19, rowEnd: 14 },
  { colStart: 20, rowStart: 10, colEnd: 23, rowEnd: 13 },
  { colStart: 20, rowStart: 14, colEnd: 23, rowEnd: 18 },
  { colStart:  1, rowStart: 10, colEnd:  4, rowEnd: 18 },
  { colStart: 10, rowStart:  7, colEnd: 15, rowEnd: 12 },
  { colStart:  1, rowStart:  5, colEnd:  4, rowEnd:  8 },
  { colStart:  1, rowStart:  1, colEnd:  4, rowEnd:  4 },
  { colStart:  5, rowStart:  5, colEnd:  8, rowEnd:  8 },
  { colStart:  5, rowStart:  1, colEnd:  8, rowEnd:  4 },
  { colStart:  9, rowStart:  1, colEnd: 11, rowEnd:  5 },
  { colStart: 14, rowStart:  1, colEnd: 16, rowEnd:  5 },
  { colStart: 17, rowStart:  1, colEnd: 19, rowEnd:  4 },
  { colStart: 17, rowStart:  5, colEnd: 18, rowEnd:  8 },
  { colStart: 19, rowStart:  5, colEnd: 23, rowEnd:  8 },
  { colStart: 20, rowStart:  1, colEnd: 23, rowEnd:  4 },
];

function isInHistoria1Room(col: number, row: number): boolean {
  return HISTORIA1_ROOMS.some(r =>
    col >= r.colStart && col <= r.colEnd &&
    row >= r.rowStart && row <= r.rowEnd
  );
}

function isInSpawnVisibilityRange(col: number, row: number): boolean {
  return SPAWN_POSITIONS.some(s =>
    (s.row === row && Math.abs(s.col - col) <= 4) ||
    (s.col === col && Math.abs(s.row - row) <= 4)
  );
}

export function isProhibitedCell(col: number, row: number, isHistoria1 = false): boolean {
  if (isSpawnCell(col, row)) return true;
  if (!isInSpawnVisibilityRange(col, row)) return false;
  if (isHistoria1 && isInHistoria1Room(col, row)) return false;
  return true;
}

function getInitials(nombre: string) {
  return nombre.slice(0, 2).toUpperCase();
}

function EnemyTokenNode({
  enemy,
  x,
  y,
  tokenRadius,
  onRemove,
  onPointerDown,
}: {
  enemy: PlacedEnemy;
  x: number;
  y: number;
  tokenRadius: number;
  onRemove: () => void;
  onPointerDown: () => void;
}) {
  const img = useEnemyImage(enemy.nombre);
  const imgLoaded = !!img;

  return (
    <Group
      x={x}
      y={y}
      onDblClick={onRemove}
      onDblTap={onRemove}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      cursor="grab"
    >
      {/* Aura exterior */}
      <Circle
        radius={tokenRadius + 5}
        fillEnabled={false}
        stroke="rgba(227, 68, 60, 0.28)"
        strokeWidth={1}
        listening={false}
      />
      {/* Fondo */}
      <Circle
        radius={tokenRadius}
        fill="rgba(110, 10, 10, 0.92)"
        stroke={ENEMY_COLOR}
        strokeWidth={2}
        shadowColor="rgba(220, 30, 30, 0.7)"
        shadowBlur={12}
      />
      {/* Imagen circular */}
      {imgLoaded && (
        <Group
          clipFunc={(ctx) => {
            ctx.arc(0, 0, tokenRadius - 1, 0, Math.PI * 2, false);
          }}
          listening={false}
        >
          <KonvaImage
            image={img}
            x={-tokenRadius}
            y={-tokenRadius}
            width={tokenRadius * 2}
            height={tokenRadius * 2}
          />
        </Group>
      )}
      {/* Borde encima de la imagen */}
      {imgLoaded && (
        <Circle
          radius={tokenRadius}
          fillEnabled={false}
          stroke={ENEMY_COLOR}
          strokeWidth={2}
          listening={false}
        />
      )}
      {/* Fallback iniciales */}
      {!imgLoaded && (
        <Text
          x={-tokenRadius}
          y={-tokenRadius + 2}
          width={tokenRadius * 2}
          height={tokenRadius * 2}
          text={getInitials(enemy.nombre)}
          align="center"
          verticalAlign="middle"
          fontSize={Math.max(8, Math.round(tokenRadius * 0.55))}
          fontStyle="bold"
          fill="#fff"
          listening={false}
        />
      )}
    </Group>
  );
}

function TrapTokenNode({
  trap,
  x,
  y,
  tokenRadius,
  onRemove,
  onPointerDown,
}: {
  trap: PlacedTrap;
  x: number;
  y: number;
  tokenRadius: number;
  onRemove: () => void;
  onPointerDown: () => void;
}) {
  const [img, imgStatus] = useImage(trap.imageUrl);
  const imgLoaded = imgStatus === 'loaded' && !!img;

  return (
    <Group
      x={x}
      y={y}
      onDblClick={onRemove}
      onDblTap={onRemove}
      onMouseDown={onPointerDown}
      onTouchStart={onPointerDown}
      cursor="grab"
    >
      <Circle
        radius={tokenRadius + 5}
        fillEnabled={false}
        stroke="rgba(224, 128, 48, 0.28)"
        strokeWidth={1}
        listening={false}
      />
      <Circle
        radius={tokenRadius}
        fill="rgba(100, 50, 5, 0.92)"
        stroke={TRAP_COLOR}
        strokeWidth={2}
        shadowColor="rgba(200, 110, 20, 0.7)"
        shadowBlur={12}
      />
      {imgLoaded && (
        <Group
          clipFunc={(ctx) => { ctx.arc(0, 0, tokenRadius - 1, 0, Math.PI * 2, false); }}
          listening={false}
        >
          <KonvaImage
            image={img}
            x={-tokenRadius}
            y={-tokenRadius}
            width={tokenRadius * 2}
            height={tokenRadius * 2}
          />
        </Group>
      )}
      {imgLoaded && (
        <Circle radius={tokenRadius} fillEnabled={false} stroke={TRAP_COLOR} strokeWidth={2} listening={false} />
      )}
      {!imgLoaded && (
        <Text
          x={-tokenRadius}
          y={-tokenRadius + 2}
          width={tokenRadius * 2}
          height={tokenRadius * 2}
          text={trap.nombre.slice(0, 2).toUpperCase()}
          align="center"
          verticalAlign="middle"
          fontSize={Math.max(8, Math.round(tokenRadius * 0.55))}
          fontStyle="bold"
          fill="#fff"
          listening={false}
        />
      )}
    </Group>
  );
}

export const MasterPrepBoard = forwardRef<MasterPrepBoardHandle, MasterPrepBoardProps>(
  function MasterPrepBoard(
    { mapConfig, placedEnemies, onEnemyRemove, onEnemyMove, placedTraps, onTrapRemove, onTrapMove, isDraggingFromBench, onBlockedMove, showDebugGrid = false },
    ref
  ) {
    const isHistoria1 = mapConfig.imageUrl.includes('tableroModHistoria1');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [stageSize, setStageSize] = useState<Size>({ width: 1, height: 1 });
    const [hoverCell, setHoverCell] = useState<CellPos | null>(null);
    const draggingTokenRef = useRef<{ instanciaId: string; type: 'enemy' | 'trap' } | null>(null);

    const [mapImage] = useImage(mapConfig.imageUrl);

    // ── Mismo sistema de coordenadas que GameBoard ──────────────
    const fitScale = stageSize.width > 1
      ? Math.min(stageSize.width / mapConfig.naturalWidth, stageSize.height / mapConfig.naturalHeight)
      : 1;
    const renderScale = fitScale * 0.93;
    const mapRenderWidth = mapConfig.naturalWidth * renderScale;
    const mapRenderHeight = mapConfig.naturalHeight * renderScale;
    const mapOriginX = (stageSize.width - mapRenderWidth) / 2;
    const mapOriginY = (stageSize.height - mapRenderHeight) / 2;
    const cellSide = mapConfig.cellSize * renderScale;
    const tokenRadius = Math.max(9, mapConfig.cellSize * renderScale * TOKEN_RADIUS_FACTOR);

    // Ref para que useImperativeHandle siempre use los valores actuales
    const coordsRef = useRef({ mapOriginX, mapOriginY, renderScale, isHistoria1 });
    coordsRef.current = { mapOriginX, mapOriginY, renderScale, isHistoria1 };

    const { pixelToCell, cellToPixel } = useBoardGrid(mapConfig);

    // ── Resize observer ──────────────────────────────────────────
    useEffect(() => {
      const el = wrapperRef.current;
      if (!el) return;
      const ro = new ResizeObserver(entries => {
        for (const e of entries) {
          setStageSize({ width: Math.max(1, e.contentRect.width), height: Math.max(1, e.contentRect.height) });
        }
      });
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    // ── Expose tryDrop al padre (DnD desde el bench) ─────────────
    useImperativeHandle(ref, () => ({
      tryDrop(clientX: number, clientY: number): TryDropResult {
        const canvas = wrapperRef.current?.querySelector('canvas');
        if (!canvas) return { ok: false, reason: 'outOfBounds' };
        const rect = canvas.getBoundingClientRect();
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom)
          return { ok: false, reason: 'outOfBounds' };
        const { mapOriginX: ox, mapOriginY: oy, renderScale: rs, isHistoria1: h1 } = coordsRef.current;
        const cell = pixelToCell(clientX - rect.left - ox, clientY - rect.top - oy, rs);
        if (!cell) return { ok: false, reason: 'outOfBounds' };
        if (isProhibitedCell(cell.col, cell.row, h1)) return { ok: false, reason: 'blocked' };
        return { ok: true, col: cell.col, row: cell.row };
      },
    }), [pixelToCell]);

    // ── Conversión puntero → celda (coordenadas de Stage) ────────
    const pointerToCell = useCallback((stageX: number, stageY: number): CellPos | null => {
      return pixelToCell(stageX - mapOriginX, stageY - mapOriginY, renderScale);
    }, [mapOriginX, mapOriginY, renderScale, pixelToCell]);

    // ── Celda → posición en pantalla (centro) ────────────────────
    const cellToScreen = useCallback((col: number, row: number) => {
      const { x, y } = cellToPixel(col, row);
      return { x: mapOriginX + x * renderScale, y: mapOriginY + y * renderScale };
    }, [mapOriginX, mapOriginY, renderScale, cellToPixel]);

    // ── Grid debug cells ─────────────────────────────────────────
    const debugGridCells = useMemo(() => {
      const cells: CellPos[] = [];
      for (let row = 0; row < mapConfig.rows; row++) {
        for (let col = 0; col < mapConfig.cols; col++) {
          cells.push({ col, row });
        }
      }
      return cells;
    }, [mapConfig.cols, mapConfig.rows]);

    // ── Handlers del Stage ───────────────────────────────────────
    const handlePointerMove = useCallback((e: any) => {
      const pos = e.target.getStage()?.getPointerPosition();
      if (!pos) return;
      const cell = pointerToCell(pos.x, pos.y);
      setHoverCell(isDraggingFromBench || draggingTokenRef.current ? cell : null);
    }, [isDraggingFromBench, pointerToCell]);

    const handlePointerUp = useCallback((_e: any) => {
      if (draggingTokenRef.current && hoverCell) {
        if (isProhibitedCell(hoverCell.col, hoverCell.row, isHistoria1)) {
          onBlockedMove?.();
        } else {
          const { instanciaId, type } = draggingTokenRef.current;
          if (type === 'enemy') onEnemyMove(instanciaId, hoverCell.col, hoverCell.row);
          else onTrapMove(instanciaId, hoverCell.col, hoverCell.row);
        }
      }
      draggingTokenRef.current = null;
      setHoverCell(null);
    }, [hoverCell, isHistoria1, onBlockedMove, onEnemyMove, onTrapMove]);

    const handlePointerLeave = useCallback(() => {
      draggingTokenRef.current = null;
      setHoverCell(null);
    }, []);

    return (
      <div className="master-prep-board" ref={wrapperRef}>
        <div className="master-prep-hint">
          {isDraggingFromBench
            ? 'Suelta sobre el tablero para colocar al enemigo'
            : 'Doble clic sobre un token para eliminarlo · Arrastra para moverlo'}
        </div>

        <Stage
          width={stageSize.width}
          height={stageSize.height}
          onMouseMove={handlePointerMove}
          onTouchMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchEnd={handlePointerUp}
          onMouseLeave={handlePointerLeave}
          style={{ cursor: isDraggingFromBench ? 'crosshair' : 'default', borderRadius: '12px' }}
        >
          {/* Layer 1: Mapa — mismo pattern que GameBoard */}
          <Layer listening={false}>
            <Group x={mapOriginX} y={mapOriginY} scaleX={renderScale} scaleY={renderScale}>
              {mapImage && (
                <KonvaImage
                  image={mapImage}
                  x={0}
                  y={0}
                  width={mapConfig.naturalWidth}
                  height={mapConfig.naturalHeight}
                />
              )}
              {!mapImage && (
                <Rect x={0} y={0} width={mapConfig.naturalWidth} height={mapConfig.naturalHeight} fill="#0a0203" />
              )}
            </Group>
          </Layer>

          {/* Layer 2: Cuadrícula de debug en amarillo con coordenadas */}
          {showDebugGrid && (
            <Layer listening={false}>
              {debugGridCells.map(({ col, row }) => {
                const cellX = mapOriginX + (mapConfig.offsetX + col * mapConfig.cellSize) * renderScale;
                const cellY = mapOriginY + (mapConfig.offsetY + row * mapConfig.cellSize) * renderScale;
                const fontSize = Math.max(5, cellSide * 0.22);
                return (
                  <Group key={`g-${col}-${row}`}>
                    <Rect
                      x={cellX}
                      y={cellY}
                      width={cellSide}
                      height={cellSide}
                      stroke={isSpawnCell(col, row) ? 'rgba(100, 180, 255, 0.7)' : 'rgba(255, 220, 0, 0.45)'}
                      strokeWidth={0.6}
                      fill={isSpawnCell(col, row) ? 'rgba(60, 120, 220, 0.18)' : undefined}
                      fillEnabled={isSpawnCell(col, row)}
                    />
                    {isSpawnCell(col, row) && (
                      <Text
                        x={cellX}
                        y={cellY}
                        width={cellSide}
                        height={cellSide}
                        text="✕"
                        align="center"
                        verticalAlign="middle"
                        fontSize={Math.max(6, cellSide * 0.35)}
                        fill="rgba(100, 180, 255, 0.6)"
                        listening={false}
                      />
                    )}
                    <Text
                      x={cellX + 2}
                      y={cellY + 2}
                      text={`${col},${row}`}
                      fontSize={fontSize}
                      fill={isSpawnCell(col, row) ? 'rgba(100, 180, 255, 0.8)' : 'rgba(255, 220, 0, 0.75)'}
                      listening={false}
                    />
                  </Group>
                );
              })}
            </Layer>
          )}

          {/* Layer 3: Hover de celda */}
          {hoverCell && (
            <Layer listening={false}>
              <Rect
                x={mapOriginX + (mapConfig.offsetX + hoverCell.col * mapConfig.cellSize) * renderScale}
                y={mapOriginY + (mapConfig.offsetY + hoverCell.row * mapConfig.cellSize) * renderScale}
                width={cellSide}
                height={cellSide}
                fill="rgba(220, 50, 50, 0.28)"
                stroke="rgba(227, 68, 60, 0.9)"
                strokeWidth={2}
                cornerRadius={3}
                listening={false}
              />
            </Layer>
          )}

          {/* Layer 4: Tokens de enemigos */}
          <Layer>
            {placedEnemies.map(enemy => {
              const { x, y } = cellToScreen(enemy.col, enemy.row);
              return (
                <EnemyTokenNode
                  key={enemy.instanciaId}
                  enemy={enemy}
                  x={x}
                  y={y}
                  tokenRadius={tokenRadius}
                  onRemove={() => onEnemyRemove(enemy.instanciaId)}
                  onPointerDown={() => {
                    draggingTokenRef.current = { instanciaId: enemy.instanciaId, type: 'enemy' };
                  }}
                />
              );
            })}
          </Layer>

          {/* Layer 5: Tokens de trampas */}
          <Layer>
            {placedTraps.map(trap => {
              const { x, y } = cellToScreen(trap.col, trap.row);
              return (
                <TrapTokenNode
                  key={trap.instanciaId}
                  trap={trap}
                  x={x}
                  y={y}
                  tokenRadius={tokenRadius}
                  onRemove={() => onTrapRemove(trap.instanciaId)}
                  onPointerDown={() => {
                    draggingTokenRef.current = { instanciaId: trap.instanciaId, type: 'trap' };
                  }}
                />
              );
            })}
          </Layer>
        </Stage>
      </div>
    );
  }
);
