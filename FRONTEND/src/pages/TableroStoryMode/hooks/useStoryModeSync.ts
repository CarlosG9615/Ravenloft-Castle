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

// Colores por ordenUnion (se usan para tokens). Si hay más jugadores, se reutilizan por módulo.
const ORDER_COLORS = ['#C0392B', '#2980B9', '#27AE60', '#8E44AD', '#E67E22', '#F39C12'];
const getColorForOrden = (orden: number | null | undefined): string => {
  if (orden == null || Number.isNaN(Number(orden))) return '#4a90d9';
  const idx = Number(orden) % ORDER_COLORS.length;
  return ORDER_COLORS[idx];
};

// Obtener token del storage
const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

/**
 * Hook personalizado para sincronizar jugadores en Story Mode
 * Conecta via WebSocket a /topic/mision/{misionId}/jugadores
 */
export function useStoryModeSync(
  misionId: string | number | null | undefined,
  jugadorActual: any,
  initialJugadores: any[] = []
) {
  const jugadorId = jugadorActual?.id ?? jugadorActual?.personajeId ?? null;
  const jugadorPersonajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? null;

  // Ref para el payload del join: se actualiza en cada render pero NO dispara reconexión
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

  useEffect(() => {
    if (!misionId || !jugadorActual) {
      return;
    }

    const token = getToken();
    if (!token) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new (SockJS as any)('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        setConectado(true);

        // Suscribirse a los jugadores de esta misión
        client.subscribe(
          `/topic/mision/${misionId}/jugadores`,
          (frame) => {
            try {
              const list = JSON.parse(frame.body);
              if (Array.isArray(list)) {
                const mapped = list.map((p: any) => {
                  const orden = p?.ordenUnion;
                  return {
                    ...p,
                    // ParticipanteJugadorDTO usa nombrePersonaje/usuarioId; normalizar
                    id: p.usuarioId ?? p.id,
                    nombre: p.nombrePersonaje ?? p.nombre,
                    ordenUnion: orden,
                    color: getColorForOrden(orden),
                  };
                });
                setJugadoresSincronizados(mapped);
              } else {
                setJugadoresSincronizados([]);
              }
            } catch (e) {
              // Ignorar payloads inválidos de forma silenciosa.
            }
          }
        );

        // Suscribirse a los movimientos de tokens
        client.subscribe(`/topic/mision/${misionId}/tokens`, (frame) => {
          try {
            const move: TokenMove = JSON.parse(frame.body);
            setTokenMoves(move);
          } catch (e) {
            // Ignorar payloads inválidos de forma silenciosa.
          }
        });

        // Suscribirse al estado del turno
        client.subscribe(`/topic/mision/${misionId}/turno`, (frame) => {
          try {
            const turnoData: TurnoData = JSON.parse(frame.body);
            setTurnoActual(turnoData);
          } catch (e) {
            // Ignorar payloads inválidos de forma silenciosa.
          }
        });

        // Suscribirse a respuestas de sincronización privada
        client.subscribe(`/user/queue/mision/${misionId}/token-sync`, (frame) => {
          try {
            const tokenStates: TokenMove[] = JSON.parse(frame.body);
            // Aplicar cada estado de token recibido
            tokenStates.forEach((state) => {
              setTokenMoves(state);
            });
          } catch (e) {
            // Ignorar payloads inválidos de forma silenciosa.
          }
        });

        // Solicitar sincronización de posiciones de tokens actuales
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        client.publish({
          destination: `/app/mision/${misionId}/token-request-sync`,
          body: JSON.stringify({
            sessionId: sessionId,
          }),
        });

        // Notificar que este jugador se une a la misión
        if (jugadorId || jugadorPersonajeId) {
          client.publish({
            destination: `/app/mision/${misionId}/join`,
            body: JSON.stringify(jugadorPayloadRef.current),
          });
        }
      },

      onDisconnect: () => {
        setConectado(false);
      },

      onStompError: () => {
        setConectado(false);
      },
    });

    const handleBeforeUnload = () => {
      // Evitar publicar `leave` en beforeunload para no provocar efectos
      // secundarios en el backend que puedan forzar re-login del cliente.
      // La desconexión se maneja en el cleanup del hook.
      return;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    client.activate();
    stompRef.current = client;

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      client.deactivate();
    };
  // Solo reconectar cuando cambia la misión o el jugador, no por valores derivados
  }, [misionId, jugadorId, jugadorPersonajeId]);

  return { jugadoresSincronizados, conectado, tokenMoves, sendTokenMove, turnoActual, sendFinTurno, sendIniciarRonda };
}
