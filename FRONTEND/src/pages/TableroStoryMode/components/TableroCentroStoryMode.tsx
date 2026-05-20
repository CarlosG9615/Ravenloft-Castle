import { useState, useMemo, useEffect } from 'react';
import { GameBoard } from './GameBoard';
import type { BoardToken } from './GameBoard';
import type { MapConfig } from '../hooks/useBoardGrid';
import { getAvatarUrl as getAvatarUrlCloudinary } from '../../../utils/imageUtils';
import { API_URL, authHeaders } from '../../../services/api';
import type { PartidaConfig } from '../hooks/useStoryModeSync';

const PLAYER_COLORS = ['#C0392B', '#2980B9', '#F39C12', '#27AE60'];

// Posiciones de spawn iniciales para jugadores, fijas según ordenUnion
const SPAWN_POSITIONS = [
  { col: 12, row: 18 },  // jugador 0 (rojo)
  { col: 13, row: 18 },  // jugador 1 (azul)
  { col: 12, row: 19 },  // jugador 2 (amarillo)
  { col: 13, row: 19 },  // jugador 3 (verde)
];


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
  facil:  { ...BASE_MAP_CONFIG, imageUrl: '/images/tableros/tableroModHistoria1.png', offsetX: BASE_MAP_CONFIG.offsetX + 6, offsetY: BASE_MAP_CONFIG.offsetY + 12 },
  media:  { ...BASE_MAP_CONFIG, imageUrl: '/images/tableros/tableroModHistoria2.png' },
  dificil: { ...BASE_MAP_CONFIG, imageUrl: '/images/tableros/tableroModHistoria3.png' },
};


interface PersonajeStoryMode {
  avatar?: string | null;
  nombre?: string | null;
  nivel?: number | null;
}

interface MisionStoryMode {
  id?: string | number;
  dificultad?: string | null;
}

interface Jugador {
  id?: string | number;
  usuario_id?: string | number;
  nombre: string;
  clase?: string;
  avatar?: string | null;
  color?: string;
  nivel?: number | null;
  conectado?: boolean;
}

interface ParticipanteDTO {
  usuarioId: number;
  personajeId: number;
  nombreUsuario: string;
  nombrePersonaje: string;
  clase: string;
  nivel: number;
  saludActual: number;
  saludMax: number;
  avatar: string;
  tokenCol: number;
  tokenRow: number;
  ordenUnion?: number;
}

interface Props {
  personaje?: PersonajeStoryMode | null;
  mision?: MisionStoryMode | null;
  jugadoresSincronizados?: Jugador[];
  jugadorActual?: any;
  tokenMoves?: { userId: string | number; col: number; row: number } | null;
  sendTokenMove?: (col: number, row: number) => void;
  turnoActual?: { turnoActualPersonajeId: string | number | null; fase: 'personajes' | 'master' } | null;
  sendFinTurno?: (personajeId: string | number) => void;
  onParticipantesLoaded?: (participantes: ParticipanteDTO[]) => void;
  movimientoRoll?: number | null;
  onMovimientoUsed?: (steps: number) => void;
  configPartida?: PartidaConfig | null;
  bloqueado?: boolean;
  esMaster?: boolean;
  revealedRooms?: string[];
  onRoomRevealed?: (roomId: string) => void;
  onEnemyMove?: (instanciaId: string, col: number, row: number) => void;
  onMasterFinTurno?: () => void;
  nombreMaster?: string;
  onActiveEnemiesChange?: (ids: Set<string>) => void;
  onOpenEnemyDetails?: (instanciaId: string) => void;
  removedTrapIds?: Set<string>;
  revealedTrapIds?: Set<string>;
  blockedCells?: Map<string, string>;
  onCellBlocked?: (col: number, row: number, imageUrl: string) => void;
  onTrapTriggered?: (instanciaId: string, outcome: 'daño' | 'superado') => void;
  onPlayerTokenClick?: (token: import('./GameBoard').BoardToken) => void;
}

const COLORES_CLASES: Record<string, string> = {
  Bárbaro: '#e74c3c',
  Bardo: '#9b59b6',
  Clérigo: '#f1c40f',
  Druida: '#2ecc71',
  Guerrero: '#c0392b',
  Monje: '#27ae60',
  Paladín: '#f39c12',
  Explorador: '#16a085',
  Pícaro: '#34495e',
  Hechicero: '#8e44ad',
  Brujo: '#2980b9',
  Mago: '#3498db',
  Desconocida: '#95a5a6'
};

const resolveAvatarUrl = (avatar: string | undefined | null): string => {
  if (!avatar || !avatar.trim()) return '/images/avatars/default.png';
  
  const trimmedAvatar = avatar.trim();
  
  // Si ya es una URL completa o data URI válida, devolverla directamente
  if (/^https?:\/\//i.test(trimmedAvatar) || /^data:/i.test(trimmedAvatar)) {
    return trimmedAvatar;
  }
  
  // Si es una ruta local (empieza con /), devolverla directamente
  if (trimmedAvatar.startsWith('/')) {
    return trimmedAvatar;
  }
  
  // Si no termina en .png, intenta procesarla con Cloudinary
  if (!trimmedAvatar.endsWith('.png')) {
    const cloudinaryUrl = getAvatarUrlCloudinary(trimmedAvatar);
    // Validar que la URL es válida
    if (cloudinaryUrl && /^https?:\/\//.test(cloudinaryUrl)) {
      return cloudinaryUrl;
    }
  }
  
  // Si ya termina en .png, asumir que es una ruta local si no comienza con http
  if (trimmedAvatar.endsWith('.png') && !/^https?:\/\//.test(trimmedAvatar)) {
    return `/assets/avatares/${trimmedAvatar}`;
  }
  
  // Fallback por defecto
  return '/images/avatars/default.png';
};

const getColorForJugador = (jugador: Jugador | PersonajeStoryMode): string => {
  if ((jugador as Jugador).color) return (jugador as Jugador).color ?? '#4a90d9';
  if ((jugador as Jugador).clase && COLORES_CLASES[(jugador as Jugador).clase!]) {
    return COLORES_CLASES[(jugador as Jugador).clase!];
  }
  return '#4a90d9';
};

export function TableroCentroStoryMode({
  personaje = null,
  mision = null,
  jugadoresSincronizados = [],
  jugadorActual = null,
  tokenMoves = null,
  sendTokenMove,
  turnoActual = null,
  sendFinTurno,
  onParticipantesLoaded,
  movimientoRoll = null,
  onMovimientoUsed,
  configPartida = null,
  bloqueado: _bloqueado = false,
  esMaster = false,
  revealedRooms = [],
  onRoomRevealed,
  onEnemyMove,
  onMasterFinTurno,
  nombreMaster,
  onActiveEnemiesChange,
  onOpenEnemyDetails,
  removedTrapIds,
  revealedTrapIds,
  blockedCells,
  onCellBlocked,
  onTrapTriggered,
  onPlayerTokenClick,
}: Props) {
  const [participantes, setParticipantes] = useState<ParticipanteDTO[]>([]);

  const mapConfig = MAP_BY_DIFFICULTY[mision?.dificultad?.toLowerCase() ?? ''] ?? MAP_BY_DIFFICULTY.facil;

  // Cargar participantes desde el endpoint cuando monta, cambia misionId, o cambia el nº de jugadores
  useEffect(() => {
    if (!mision?.id) {
      setParticipantes([]);
      return;
    }

    const loadParticipantes = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/misiones/${mision.id}/participantes/jugadores`,
          {
            headers: {
              ...Object.fromEntries(authHeaders().entries()),
              Accept: 'application/json',
            },
          }
        );

        const contentType = response.headers.get('content-type');
        const isJson = contentType?.includes('application/json');

        if (response.ok && isJson) {
          const data: ParticipanteDTO[] = await response.json();
          setParticipantes(data);
          onParticipantesLoaded?.(data);
        } else if (!isJson) {
          const text = await response.text();
          console.error('❌ Endpoint devolvió HTML en lugar de JSON. Status:', response.status);
          console.error('Response preview:', text.substring(0, 300));
          setParticipantes([]);
        } else {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          console.error('❌ Error loading participantes:', errorData);
          setParticipantes([]);
        }
      } catch (error) {
        console.error('❌ Error fetching participantes:', error);
        setParticipantes([]);
      }
    };

    loadParticipantes();
  // jugadoresSincronizados.length: re-fetch cuando alguien se une o abandona
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mision?.id, jugadoresSincronizados.length]);

  // Generar tokens desde participantes de la BD
  const tokensFromParticipantes = useMemo(() => {
    return participantes.map(p => {
      // Determinar posición: usar posición guardada si existe, si no usar spawn según ordenUnion
      const ordenUnion = p.ordenUnion ?? 0;
      const spawn = SPAWN_POSITIONS[ordenUnion] ?? { col: 12, row: 19 };
      const col = p.tokenCol && p.tokenCol > 0 ? p.tokenCol : spawn.col;
      const row = p.tokenRow && p.tokenRow > 0 ? p.tokenRow : spawn.row;

      return {
        id: p.personajeId.toString(),
        col,
        row,
        color: PLAYER_COLORS[ordenUnion] ?? '#888888',
        initials: p.nombrePersonaje.slice(0, 2).toUpperCase(),
        avatarUrl: resolveAvatarUrl(p.avatar),
        movement: 6,
      };
    });
  }, [participantes]);

  // Generar tokens dinámicamente basados en jugadores conectados (fallback si participantes vacío)
  const initialTokens = useMemo(() => {
    // Si tenemos participantes de la BD, usarlos
    if (participantes.length > 0) {
      return tokensFromParticipantes;
    }

    // Fallback: usar jugadores sincronizados por WebSocket
    const tokens: BoardToken[] = [];

    // Buscar el usuario actual en jugadores sincronizados
    const jugadorActualEnSync = jugadoresSincronizados.find(
      j => (j.id === jugadorActual?.id || 
            j.id === jugadorActual?.usuario_id ||
            j.usuario_id === jugadorActual?.id ||
            j.usuario_id === jugadorActual?.usuario_id) &&
           j.conectado !== false
    );

    // Token del usuario actual - combinar datos del personaje prop y del sync
    const usuarioActual = personaje || jugadorActualEnSync;
    if (usuarioActual) {
      tokens.push({
        id: jugadorActual?.id?.toString() || jugadorActual?.usuario_id?.toString() || 'principal',
        col: 12,
        row: 19,
        color: getColorForJugador(usuarioActual),
        initials: (usuarioActual.nombre ?? 'PJ').trim().slice(0, 2).toUpperCase(),
        avatarUrl: resolveAvatarUrl((usuarioActual as any).avatar),
        movement: 6,
      });
    }

    // Tokens de aliados conectados
    const aliados = jugadoresSincronizados.filter(j => {
      if (!jugadorActual) return j.conectado !== false;
      
      // Convertir IDs a números para comparación segura
      const actualUserId = Number(jugadorActual.id) || Number(jugadorActual.usuario_id) || Number((jugadorActual as any).personajeId);
      const jugadorUserId = Number(j.id) || Number(j.usuario_id) || Number((j as any).personajeId);
      
      // Comparación primaria: IDs numéricos
      if (actualUserId && jugadorUserId && actualUserId === jugadorUserId) {
        return false;
      }
      
      // Comparación secundaria: nombre (más segura)
      if (jugadorActual.nombre && j.nombre) {
        const actualNombre = String(jugadorActual.nombre).toLowerCase().trim();
        const jugadorNombre = String(j.nombre).toLowerCase().trim();
        if (actualNombre && jugadorNombre && actualNombre === jugadorNombre) {
          return false;
        }
      }
      
      return j.conectado !== false;
    });

    aliados.forEach((aliado, index) => {
      // Posicionar aliados alrededor del personaje principal
      const offset = (index % 3);
      const row = 18 - Math.floor(index / 3);
      const col = 11 + offset;

      tokens.push({
        id: aliado.id?.toString() || `aliado-${index}`,
        col,
        row,
        color: getColorForJugador(aliado),
        initials: (aliado.nombre ?? `A${index + 1}`).trim().slice(0, 2).toUpperCase(),
        avatarUrl: resolveAvatarUrl(aliado.avatar),
        movement: 6,
      });
    });

    return tokens;
  }, [participantes, tokensFromParticipantes, personaje, jugadoresSincronizados, jugadorActual]);

  const [tokens, setTokens] = useState<BoardToken[]>(initialTokens);

  // Actualizar tokens cuando cambian jugadores sincronizados (alguien se conecta/desconecta)
  useEffect(() => {
    setTokens(initialTokens);
  }, [initialTokens]);

  useEffect(() => {
    if (!tokenMoves) return;
    setTokens((prev) => prev.map((t) => (
      t.id === tokenMoves.userId.toString()
        ? { ...t, col: tokenMoves.col, row: tokenMoves.row }
        : t
    )));
  }, [tokenMoves]);

  const handleTokenMove = (id: string, col: number, row: number) => {
    setTokens((prev) => prev.map((token) => (
      token.id === id ? { ...token, col, row } : token
    )));

    if (
      id === jugadorActual?.personajeId?.toString() ||
      id === jugadorActual?.id?.toString() ||
      id === jugadorActual?.usuario_id?.toString()
    ) {
      sendTokenMove?.(col, row);
    }
  };

  return (
    <div className="tsm-center" aria-label="Tablero del modo historia">
      <GameBoard
        mapConfig={mapConfig}
        tokens={tokens}
        onTokenMove={handleTokenMove}
        jugadores={[personaje, ...jugadoresSincronizados.filter(j => j.conectado !== false)]}
        turnoActual={turnoActual}
        sendFinTurno={sendFinTurno}
        jugadorActual={jugadorActual}
        miPersonajeId={jugadorActual?.personajeId?.toString() ?? jugadorActual?.id?.toString()}
        movimientoRoll={movimientoRoll}
        onMovimientoUsed={onMovimientoUsed}
        enemyTokens={configPartida?.enemigos ?? []}
        trapTokens={(configPartida?.trampas ?? []).filter(t => !removedTrapIds?.has(t.instanciaId))}
        esMaster={esMaster}
        revealedRooms={revealedRooms}
        onRoomRevealed={onRoomRevealed}
        onEnemyMove={onEnemyMove}
        onMasterFinTurno={onMasterFinTurno}
        nombreMaster={nombreMaster}
        onActiveEnemiesChange={onActiveEnemiesChange}
        onOpenEnemyDetails={onOpenEnemyDetails}
        onTrapTriggered={onTrapTriggered}
        blockedCells={blockedCells}
        revealedTrapIds={revealedTrapIds}
        onCellBlocked={onCellBlocked}
        onPlayerTokenClick={onPlayerTokenClick}
      />
    </div>
  );
}