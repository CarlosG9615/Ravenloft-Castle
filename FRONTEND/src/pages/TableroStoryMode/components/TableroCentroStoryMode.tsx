import { useState } from 'react';
import { GameBoard } from './GameBoard';
import type { BoardToken } from './GameBoard';
import type { MapConfig } from '../hooks/useBoardGrid';
import { getAvatarUrl } from '../../../utils/imageUtils';

const BASE_MAP_CONFIG = {
  naturalWidth: 1401,
  naturalHeight: 1123,
  cellSize: 56,
  cols: 25,
  rows: 20,
  offsetX: -20,
  offsetY: -10,
} as const;

const MAP_BY_DIFFICULTY: Record<string, MapConfig> = {
  facil:  { ...BASE_MAP_CONFIG, imageUrl: '/images/tableros/tableroModHistoria1.png' },
  media:  { ...BASE_MAP_CONFIG, imageUrl: '/images/tableros/tableroModHistoria2.png' },
  dificil: { ...BASE_MAP_CONFIG, imageUrl: '/images/tableros/tableroModHistoria3.png' },
};

interface PersonajeStoryMode {
  avatar?: string | null;
  nombre?: string | null;
}

interface MisionStoryMode {
  dificultad?: string | null;
}

interface Props {
  personaje?: PersonajeStoryMode | null;
  mision?: MisionStoryMode | null;
}

const resolveAvatarUrl = (avatar: string | undefined | null): string => {
  if (!avatar) return '/images/avatars/default.png';
  if (/^https?:\/\//i.test(avatar) || /^data:/i.test(avatar)) return avatar;
  return getAvatarUrl(avatar);
};

export function TableroCentroStoryMode({ personaje = null, mision = null }: Props) {
  const mapConfig = MAP_BY_DIFFICULTY[mision?.dificultad?.toLowerCase() ?? ''] ?? MAP_BY_DIFFICULTY.facil;
  const [tokens, setTokens] = useState<BoardToken[]>([
    {
      id: 'principal',
      col: 12,
      row: 19,
      color: 'rgba(139, 0, 0, 0.5)',
      initials: (personaje?.nombre ?? 'PJ').trim().slice(0, 2).toUpperCase(),
      avatarUrl: resolveAvatarUrl(personaje?.avatar),
      movement: 6,
    },
    {
      id: 'aliado-azul',
      col: 12,
      row: 18,
      color: 'rgba(74, 144, 217, 0.7)',
      initials: 'A1',
      avatarUrl: resolveAvatarUrl(null),
      movement: 6,
    },
    {
      id: 'aliado-amarillo',
      col: 13,
      row: 19,
      color: 'rgba(241, 196, 15, 0.75)',
      initials: 'A2',
      avatarUrl: resolveAvatarUrl(null),
      movement: 6,
    },
    {
      id: 'aliado-verde',
      col: 13,
      row: 18,
      color: 'rgba(46, 204, 113, 0.7)',
      initials: 'A3',
      avatarUrl: resolveAvatarUrl(null),
      movement: 6,
    },
  ]);

  const handleTokenMove = (id: string, col: number, row: number) => {
    setTokens((prev) => prev.map((token) => (
      token.id === id ? { ...token, col, row } : token
    )));
  };

  return (
    <div className="tsm-center" aria-label="Tablero del modo historia">
      <GameBoard
        mapConfig={mapConfig}
        tokens={tokens}
        onTokenMove={handleTokenMove}
      />
    </div>
  );
}