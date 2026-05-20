import { useCallback } from 'react';

export interface MapConfig {
  imageUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  cellSize: number;
  offsetX: number;
  offsetY: number;
  cols: number;
  rows: number;
}

export interface BoardCell {
  col: number;
  row: number;
}

export interface BoardPixel {
  x: number;
  y: number;
}

const keyFromCell = (col: number, row: number): string => `${col},${row}`;

export function useBoardGrid(
  mapConfig: MapConfig,
  isMovementBlocked: (fromCol: number, fromRow: number, toCol: number, toRow: number) => boolean = () => false
) {
  const pixelToCell = useCallback((x: number, y: number, scale: number): BoardCell | null => {
    if (scale <= 0) return null;

    const mapX = x / scale;
    const mapY = y / scale;

    const col = Math.round((mapX - mapConfig.offsetX - mapConfig.cellSize / 2) / mapConfig.cellSize);
    const row = Math.round((mapY - mapConfig.offsetY - mapConfig.cellSize / 2) / mapConfig.cellSize);

    if (col < 0 || col >= mapConfig.cols || row < 0 || row >= mapConfig.rows) {
      return null;
    }

    return { col, row };
  }, [mapConfig.cellSize, mapConfig.cols, mapConfig.offsetX, mapConfig.offsetY, mapConfig.rows]);

  const cellToPixel = useCallback((col: number, row: number): BoardPixel => {
    return {
      x: mapConfig.offsetX + col * mapConfig.cellSize + mapConfig.cellSize / 2,
      y: mapConfig.offsetY + row * mapConfig.cellSize + mapConfig.cellSize / 2,
    };
  }, [mapConfig.cellSize, mapConfig.offsetX, mapConfig.offsetY]);

  const getReachableCells = useCallback((col: number, row: number, maxSteps: number): Set<string> => {
    const reachable = new Set<string>();
    const queue: Array<{ col: number; row: number; steps: number }> = [{ col, row, steps: 0 }];
    const visited = new Set<string>([keyFromCell(col, row)]);

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) continue;

      reachable.add(keyFromCell(current.col, current.row));
      if (current.steps >= maxSteps) continue;

      const neighbors: BoardCell[] = [
        { col: current.col + 1, row: current.row },
        { col: current.col - 1, row: current.row },
        { col: current.col, row: current.row + 1 },
        { col: current.col, row: current.row - 1 },
      ];

      for (const next of neighbors) {
        if (next.col < 0 || next.col >= mapConfig.cols || next.row < 0 || next.row >= mapConfig.rows) {
          continue;
        }

        if (isMovementBlocked(current.col, current.row, next.col, next.row)) {
          continue;
        }

        const nextKey = keyFromCell(next.col, next.row);
        if (visited.has(nextKey)) continue;

        visited.add(nextKey);
        queue.push({ col: next.col, row: next.row, steps: current.steps + 1 });
      }
    }

    return reachable;
  }, [isMovementBlocked, mapConfig.cols, mapConfig.rows]);

  return {
    pixelToCell,
    cellToPixel,
    getReachableCells,
  };
}