import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

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
  initialJugadores: any[] = []
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
  const stompRef = useRef<Client | null>(null);

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

  useEffect(() => {
    if (!misionId || !jugadorActual) return;
    const token = getToken();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new (SockJS as any)('http://localhost:8080/ws'),
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
      },

      onDisconnect: () => setConectado(false),
      onStompError: () => setConectado(false),
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
    };
  }, [misionId, jugadorId, jugadorPersonajeId]);

  return {
    jugadoresSincronizados,
    conectado,
    tokenMoves,
    turnoActual,
    dadosRoll,
    sendTokenMove,
    sendFinTurno,
    sendIniciarRonda,
    sendDadoMovimiento,
    sendDadoAtaque,
    sendChatMessage,
  };
}
