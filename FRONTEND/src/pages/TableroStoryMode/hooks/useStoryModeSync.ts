import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_URL, API_URL, authHeaders } from '../../../services/api';

interface JugadorSync {
  id: string | number;
  nombre: string;
  clase?: string;
  hp?: number;
  hpMax?: number;
  color?: string;
  conectado?: boolean;
  avatar?: string | null;
  nivel?: number | null;
  personajeId?: string | number;
  fuerza?: number;
  destreza?: number;
  constitucion?: number;
  inteligencia?: number;
  sabiduria?: number;
  carisma?: number;
}

interface TokenMove {
  userId: string | number;
  col: number;
  row: number;
}

export interface EnemyTokenConfig {
  instanciaId: string;
  enemigoId: number | string;
  nombre: string;
  col: number;
  row: number;
  salud?: number;
}

export interface TrapTokenConfig {
  instanciaId: string;
  trapId: string;
  nombre: string;
  imageUrl: string;
  col: number;
  row: number;
}

export interface PartidaConfig {
  misionId?: string | number;
  enemigos: EnemyTokenConfig[];
  trampas: TrapTokenConfig[];
}

interface TurnoData {
  turnoActualPersonajeId: string | number | null;
  fase: 'personajes' | 'master';
}

export interface DadosRollEntry {
  movimiento?: number | null;
  ataque?: number | null;
}

const ORDER_COLORS = ['#C0392B', '#2980B9', '#27AE60', '#8E44AD', '#E67E22', '#F39C12'];
const getColorForOrden = (orden: number | null | undefined): string => {
  if (orden == null || Number.isNaN(Number(orden))) return '#4a90d9';
  return ORDER_COLORS[Number(orden) % ORDER_COLORS.length];
};

const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

export function useStoryModeSync(
  misionId: string | number | null | undefined,
  jugadorActual: any,
  initialJugadores: any[] = [],
  esMaster = false,
  configPartidaInicial: PartidaConfig | null = null
) {
  const jugadorId = jugadorActual?.id ?? jugadorActual?.personajeId ?? null;
  const jugadorPersonajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? null;

  const jugadorPayloadRef = useRef<Record<string, unknown>>({});
  jugadorPayloadRef.current = {
    id: jugadorId,
    nombre: jugadorActual?.nombre ?? '',
    clase: jugadorActual?.clase || jugadorActual?.tipoClase || 'Desconocida',
    hp: jugadorActual?.hp || jugadorActual?.puntosGolpeActual || 10,
    hpMax: jugadorActual?.hpMax || jugadorActual?.puntosGolpeMax || 10,
    avatar: jugadorActual?.avatar ?? null,
    nivel: jugadorActual?.nivel ?? null,
    personajeId: jugadorPersonajeId,
    usuario_id: (jugadorActual as any)?.usuario_id || jugadorActual?.id || null,
  };

  const [jugadoresSincronizados, setJugadoresSincronizados] = useState<JugadorSync[]>(initialJugadores);
  const [conectado, setConectado] = useState(false);
  const [tokenMoves, setTokenMoves] = useState<TokenMove | null>(null);
  const [turnoActual, setTurnoActual] = useState<TurnoData | null>(null);
  const [dadosRoll, setDadosRoll] = useState<Record<string, DadosRollEntry>>({});
  const [masterListo, setMasterListo] = useState<boolean | null>(esMaster ? true : null);
  const [configPartida, setConfigPartida] = useState<PartidaConfig | null>(configPartidaInicial);
  const [kickedOut, setKickedOut] = useState(false);
  const [revealedRooms, setRevealedRooms] = useState<string[]>([]);
  const [enemyHpMap, setEnemyHpMap] = useState<Record<string, number>>({});
  const [playerHpMap, setPlayerHpMap] = useState<Record<string, number>>({});
  const [removedTrapIds, setRemovedTrapIds] = useState<Set<string>>(new Set());
  const [revealedTrapIds, setRevealedTrapIds] = useState<Set<string>>(new Set());
  const [blockedCells, setBlockedCells] = useState<Map<string, string>>(new Map());
  const stompRef = useRef<Client | null>(null);
  const configPartidaRef = useRef<PartidaConfig | null>(configPartidaInicial);
  configPartidaRef.current = configPartida;

  const sendTokenMove = useCallback((col: number, row: number) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId || !jugadorActual?.id) return;
    client.publish({
      destination: `/app/mision/${misionId}/token-move`,
      body: JSON.stringify({
        userId: jugadorActual.id || jugadorActual.personajeId,
        col,
        row,
      }),
    });
  }, [misionId, jugadorActual]);

  const sendFinTurno = useCallback((personajeId: string | number) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/mision/${misionId}/fin-turno`,
      body: JSON.stringify({ personajeId: Number(personajeId) }),
    });
  }, [misionId]);

  const sendIniciarRonda = useCallback(() => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/mision/${misionId}/iniciar-ronda`,
      body: JSON.stringify({}),
    });
  }, [misionId]);

  const sendDadoMovimiento = useCallback((personajeId: number, valor: number) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/mision/${misionId}/dado-movimiento`,
      body: JSON.stringify({ personajeId, valor, tipo: 'movimiento' }),
    });
  }, [misionId]);

  const sendDadoAtaque = useCallback((personajeId: number, valor: number) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/mision/${misionId}/dado-ataque`,
      body: JSON.stringify({ personajeId, valor, tipo: 'ataque' }),
    });
  }, [misionId]);

  const sendMasterAbort = useCallback(() => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/mision/${misionId}/master-abort`,
      body: JSON.stringify({}),
    });
  }, [misionId]);

  const sendRoomRevealed = useCallback((roomId: string) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/mision/${misionId}/room-revealed`,
      body: JSON.stringify({ roomId }),
    });
  }, [misionId]);

  const sendEnemyMove = useCallback((instanciaId: string, col: number, row: number) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/mision/${misionId}/enemy-move`,
      body: JSON.stringify({ instanciaId, col, row }),
    });
  }, [misionId]);

  const sendEnemyHpUpdate = useCallback((instanciaId: string, hp: number) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/mision/${misionId}/enemy-hp`,
      body: JSON.stringify({ instanciaId, hp }),
    });
  }, [misionId]);

  const sendCellBlocked = useCallback((col: number, row: number, imageUrl: string) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/mision/${misionId}/cell-blocked`,
      body: JSON.stringify({ col, row, imageUrl }),
    });
  }, [misionId]);

  const sendTrapRemoved = useCallback((instanciaId: string) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/mision/${misionId}/trap-removed`,
      body: JSON.stringify({ instanciaId }),
    });
  }, [misionId]);

  const sendTrapRevealed = useCallback((instanciaId: string) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/mision/${misionId}/trap-revealed`,
      body: JSON.stringify({ instanciaId }),
    });
  }, [misionId]);

  const sendPlayerHpUpdate = useCallback((jugadorId: string, hp: number) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/campana/${misionId}/hp-update`,
      body: JSON.stringify({ jugadorId, hp }),
    });
  }, [misionId]);

  const sendChatMessage = useCallback((mensaje: { autor: string; colorAutor?: string; texto: string; tipo?: string }) => {
    const client = stompRef.current;
    if (!client?.connected || !misionId) return;
    client.publish({
      destination: `/app/campana/${misionId}/chat.enviar`,
      body: JSON.stringify({
        autor: mensaje.autor,
        colorAutor: mensaje.colorAutor ?? '#8b0000',
        texto: mensaje.texto,
        tipo: mensaje.tipo ?? 'sistema',
        timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      }),
    });
  }, [misionId]);

  // Recuperar configPartida del backend si no viene en los parámetros
  useEffect(() => {
    if (!misionId || configPartida || (!esMaster && !misionId)) return;

    const recuperarConfig = async () => {
      try {
        const response = await fetch(`${API_URL}/api/misiones/${misionId}/config-partida`, {
          headers: authHeaders(),
        });

        if (response.ok && response.status !== 204) {
          const config: PartidaConfig = await response.json();
          setConfigPartida(config);
        }
      } catch (e) {
        console.debug('[useStoryModeSync] No se pudo recuperar configPartida del backend:', e);
        // Intentar recuperar del sessionStorage como fallback
        try {
          const saved = sessionStorage.getItem(`mission_config_${misionId}`);
          if (saved) {
            setConfigPartida(JSON.parse(saved));
          }
        } catch {}
      }
    };

    recuperarConfig();
  }, [misionId, esMaster]);

  useEffect(() => {
    if (!misionId || (!jugadorActual && !esMaster)) return;
    const token = getToken();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(`${WS_URL}/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        setConectado(true);

        client.subscribe(`/topic/mision/${misionId}/jugadores`, (frame) => {
          try {
            const list = JSON.parse(frame.body);
            if (Array.isArray(list)) {
              const rollsMap: Record<string, DadosRollEntry> = {};
              const mapped = list.map((p: any) => {
                const orden = p?.ordenUnion;
                const pid = (p.personajeId ?? p.id)?.toString();
                if (pid) {
                  rollsMap[pid] = {
                    movimiento: p.movimientoRoll ?? null,
                    ataque: p.ataqueRoll ?? null,
                  };
                }
                return {
                  ...p,
                  id: p.usuarioId ?? p.id,
                  nombre: p.nombrePersonaje ?? p.nombre,
                  hp: p.saludActual ?? p.hp,
                  hpMax: p.saludMax ?? p.hpMax,
                  ordenUnion: orden,
                  color: getColorForOrden(orden),
                };
              });
              setJugadoresSincronizados(mapped);
              setDadosRoll(rollsMap);
            } else {
              setJugadoresSincronizados([]);
            }
          } catch {}
        });

        client.subscribe(`/topic/mision/${misionId}/tokens`, (frame) => {
          try {
            const move: TokenMove = JSON.parse(frame.body);
            setTokenMoves(move);
          } catch {}
        });

        client.subscribe(`/topic/mision/${misionId}/turno`, (frame) => {
          try {
            const turnoData: TurnoData = JSON.parse(frame.body);
            // Debug: trace incoming turno messages to help diagnose desyncs
            try { console.debug('[WS] /topic/mision/%s/turno ->', misionId, turnoData); } catch (e) {}
            setTurnoActual(turnoData);
          } catch {}
        });

        client.subscribe(`/topic/mision/${misionId}/dado-roll`, (frame) => {
          try {
            const roll = JSON.parse(frame.body);
            const pid = roll.personajeId?.toString();
            if (!pid) return;
            setDadosRoll(prev => ({
              ...prev,
              [pid]: {
                ...prev[pid],
                [roll.tipo === 'movimiento' ? 'movimiento' : 'ataque']: roll.valor,
              },
            }));
          } catch {}
        });

        client.subscribe(`/user/queue/mision/${misionId}/token-sync`, (frame) => {
          try {
            const tokenStates: TokenMove[] = JSON.parse(frame.body);
            tokenStates.forEach((state) => setTokenMoves(state));
          } catch {}
        });

        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        client.publish({
          destination: `/app/mision/${misionId}/token-request-sync`,
          body: JSON.stringify({ sessionId }),
        });

        if (jugadorId || jugadorPersonajeId) {
          client.publish({
            destination: `/app/mision/${misionId}/join`,
            body: JSON.stringify(jugadorPayloadRef.current),
          });
        }

        client.subscribe(`/topic/mision/${misionId}/kicked`, () => {
          setKickedOut(true);
        });

        client.subscribe(`/topic/mision/${misionId}/room-revealed`, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            if (data.roomId) {
              setRevealedRooms(prev => prev.includes(data.roomId) ? prev : [...prev, data.roomId]);
            }
          } catch {}
        });

        client.subscribe(`/topic/mision/${misionId}/enemy-move`, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            if (data.instanciaId) {
              setConfigPartida(prev => {
                if (!prev) return prev;
                return {
                  ...prev,
                  enemigos: prev.enemigos.map(e =>
                    e.instanciaId === data.instanciaId
                      ? { ...e, col: data.col, row: data.row }
                      : e
                  ),
                };
              });
            }
          } catch {}
        });

        client.subscribe(`/topic/mision/${misionId}/enemy-hp`, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            if (data.instanciaId !== undefined && data.hp !== undefined) {
              setEnemyHpMap(prev => ({ ...prev, [data.instanciaId]: data.hp }));
            }
          } catch {}
        });

        client.subscribe(`/topic/mision/${misionId}/enemy-hp-state`, (frame) => {
          try {
            const data: Record<string, number> = JSON.parse(frame.body);
            if (data && typeof data === 'object') {
              setEnemyHpMap(prev => ({ ...prev, ...data }));
            }
          } catch {}
        });

        client.publish({
          destination: `/app/mision/${misionId}/check-enemy-hp`,
          body: JSON.stringify({}),
        });

        client.subscribe(`/topic/campana/${misionId}/hp-update`, (frame) => {
          try {
            const { jugadorId, hp } = JSON.parse(frame.body);
            if (jugadorId !== undefined && hp !== undefined) {
              setPlayerHpMap(prev => ({ ...prev, [jugadorId]: hp }));
            }
          } catch {}
        });

        client.subscribe(`/topic/mision/${misionId}/trap-removed`, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            if (data.instanciaId) {
              setRemovedTrapIds(prev => new Set([...prev, data.instanciaId]));
            }
          } catch {}
        });

        client.subscribe(`/topic/mision/${misionId}/trap-revealed`, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            if (data.instanciaId) {
              setRevealedTrapIds(prev => new Set([...prev, data.instanciaId]));
            }
          } catch {}
        });

        client.subscribe(`/topic/mision/${misionId}/traps-revealed-state`, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            if (Array.isArray(data.revealedIds)) {
              setRevealedTrapIds(new Set(data.revealedIds));
            }
          } catch {}
        });

        client.subscribe(`/topic/mision/${misionId}/traps-state`, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            if (Array.isArray(data.removedIds)) {
              setRemovedTrapIds(new Set(data.removedIds));
            }
          } catch {}
        });

        client.publish({
          destination: `/app/mision/${misionId}/check-removed-traps`,
          body: JSON.stringify({}),
        });

        client.publish({
          destination: `/app/mision/${misionId}/check-traps-revealed`,
          body: JSON.stringify({}),
        });

        client.subscribe(`/topic/mision/${misionId}/cell-blocked`, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            if (data.col !== undefined && data.row !== undefined) {
              setBlockedCells(prev => new Map([...prev, [`${data.col},${data.row}`, data.imageUrl ?? '']]));
            }
          } catch {}
        });

        client.subscribe(`/topic/mision/${misionId}/blocked-cells-state`, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            if (Array.isArray(data.blockedCells)) {
              const m = new Map<string, string>();
              for (const item of data.blockedCells) m.set(`${item.col},${item.row}`, item.imageUrl ?? '');
              setBlockedCells(m);
            }
          } catch {}
        });

        client.publish({
          destination: `/app/mision/${misionId}/check-blocked-cells`,
          body: JSON.stringify({}),
        });

        client.subscribe(`/topic/mision/${misionId}/rooms-state`, (frame) => {
          try {
            const data = JSON.parse(frame.body);
            if (Array.isArray(data.revealedRooms)) {
              setRevealedRooms(data.revealedRooms);
            }
          } catch {}
        });

        client.publish({
          destination: `/app/mision/${misionId}/check-rooms-revealed`,
          body: JSON.stringify({}),
        });

        if (esMaster && configPartidaRef.current) {
          client.publish({
            destination: `/app/mision/${misionId}/master-listo`,
            body: JSON.stringify(configPartidaRef.current),
          });
        } else if (!esMaster) {
          client.subscribe(`/topic/mision/${misionId}/partida-lista`, (frame) => {
            try {
              const config: PartidaConfig = JSON.parse(frame.body);
              setConfigPartida(config);
              setMasterListo(true);
            } catch {}
          });

          client.subscribe(`/topic/mision/${misionId}/master-estado`, (frame) => {
            try {
              const data = JSON.parse(frame.body);
              if (data.listo === false) setMasterListo(false);
            } catch {}
          });

          client.publish({
            destination: `/app/mision/${misionId}/check-partida-lista`,
            body: JSON.stringify({}),
          });
        }
      },

      onDisconnect: () => setConectado(false),
      onStompError: () => setConectado(false),
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [misionId, jugadorId, jugadorPersonajeId, esMaster]);

  useEffect(() => {
    try { console.debug('[WS HOOK] turnoActual changed ->', turnoActual); } catch (e) {}
  }, [turnoActual]);

  return {
    jugadoresSincronizados,
    conectado,
    tokenMoves,
    turnoActual,
    dadosRoll,
    masterListo,
    configPartida,
    kickedOut,
    revealedRooms,
    enemyHpMap,
    playerHpMap,
    removedTrapIds,
    blockedCells,
    sendTokenMove,
    sendFinTurno,
    sendIniciarRonda,
    sendDadoMovimiento,
    sendDadoAtaque,
    sendChatMessage,
    sendMasterAbort,
    sendRoomRevealed,
    sendEnemyMove,
    sendEnemyHpUpdate,
    sendPlayerHpUpdate,
    sendTrapRemoved,
    sendTrapRevealed,
    sendCellBlocked,
    revealedTrapIds,
  };
}
