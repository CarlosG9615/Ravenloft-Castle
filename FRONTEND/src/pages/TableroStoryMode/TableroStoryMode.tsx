import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ModalAlert } from '../../components/ModalAlert/ModalAlert';
import { buildMissionDetailsPath } from '../Mission/missionRoutes';
import { PanelLateralStoryMode } from './components/PanelLateralStoryMode';
import { PanelPartidaStoryMode } from './components/PanelPartidaStoryMode';
import { TableroCentroStoryMode } from './components/TableroCentroStoryMode';
import { useStoryModeSync } from './hooks/useStoryModeSync';
import { API_URL, authHeaders } from '../../services/api';
import './TableroStoryMode.css';

const SESSION_KEY = 'tsm_session';

function saveSession(data: { modoHistoria: any; mision: any; personaje: any; jugadorActual: any }) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {}
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function TableroStoryMode() {
  const location = useLocation();

  const rawState = (location.state as any) ?? {};

  const savedRef = useRef<any>(null);
  if (!savedRef.current) {
    savedRef.current = loadSession();
  }
  const fallback = savedRef.current ?? {};

  const modoHistoria    = rawState.modoHistoria    ?? fallback.modoHistoria    ?? null;
  const mision          = rawState.mision          ?? fallback.mision          ?? null;
  const personaje       = rawState.personaje        ?? fallback.personaje        ?? null;
  const jugadorActual   = rawState.jugadorActual   ?? rawState.personaje       ?? fallback.jugadorActual ?? fallback.personaje ?? null;
  const esMaster        = rawState.rol === 'master';
  const configPartidaInicial = rawState.configPartida ?? null;

  const nombreMaster = personaje?.nombre ?? jugadorActual?.nombre ?? 'Personaje';

  const chatSince = savedRef.current === null ? new Date().toISOString() : null;

  const [panelAbierto, setPanelAbierto] = useState(true);
  const [participantes, setParticipantes] = useState<{ personajeId: number; nombrePersonaje: string; nombreUsuario: string; ordenUnion?: number }[]>([]);
  const [movimientoRoll, setMovimientoRoll] = useState<number | null>(null);
  const [ataqueRollado, setAtaqueRollado] = useState(false);
  const [connectionTimedOut, setConnectionTimedOut] = useState(false);
  const [connectionSecondsLeft, setConnectionSecondsLeft] = useState(120);
  const [activeEnemyIds, setActiveEnemyIds] = useState<Set<string>>(new Set());

  const navigate = useNavigate();

  const {
    jugadoresSincronizados,
    conectado,
    tokenMoves,
    turnoActual,
    dadosRoll,
    masterListo,
    configPartida,
    kickedOut,
    revealedRooms,
    sendTokenMove,
    sendFinTurno,
    sendIniciarRonda,
    sendDadoMovimiento,
    sendDadoAtaque,
    sendChatMessage,
    sendMasterAbort,
    sendRoomRevealed,
    sendEnemyMove,
  } = useStoryModeSync(mision?.id, jugadorActual, rawState.jugadores ?? [], esMaster, configPartidaInicial);
  void conectado;

  useEffect(() => {
    if (mision?.id && (jugadorActual || esMaster)) {
      saveSession({ modoHistoria, mision, personaje, jugadorActual });
    }
  }, [mision?.id, jugadorActual?.id ?? jugadorActual?.personajeId]);

  const esperandoMaster = !esMaster && masterListo !== true;

  useEffect(() => {
    if (kickedOut) {
      sessionStorage.removeItem('tsm_session');
      navigate('/join/story-mode', { replace: true });
    }
  }, [kickedOut, navigate]);

  useEffect(() => {
    if (masterListo === true && connectionTimedOut) {
      setConnectionTimedOut(false);
    }
  }, [connectionTimedOut, masterListo]);

  const handleTimeoutLeave = useCallback(() => {
    const personajeId = jugadorActual?.personajeId ?? jugadorActual?.id ?? personaje?.id;

    if (mision?.id && personajeId != null) {
      fetch(`${API_URL}/api/misiones/${mision.id}/participantes/by-personaje/${personajeId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      }).catch(() => {});
    }

    sessionStorage.removeItem('tsm_session');
    setConnectionTimedOut(false);

    if (modoHistoria?.id && mision?.id) {
      navigate(buildMissionDetailsPath(modoHistoria.id, mision.id), {
        replace: true,
        state: { modoHistoria, mision },
      });
    } else {
      navigate('/join/story-mode', { replace: true });
    }
  }, [jugadorActual?.id, jugadorActual?.personajeId, modoHistoria?.id, mision?.id, navigate, personaje?.id]);

  const handleTimeoutKeepWaiting = useCallback(() => {
    setConnectionTimedOut(false);
  }, []);

  useEffect(() => {
    if (esMaster || masterListo === true || connectionTimedOut) return;

    const startedAt = Date.now();
    const deadline = startedAt + 120000;
    setConnectionSecondsLeft(120);

    const abortConnection = () => {
      setConnectionTimedOut(true);
    };

    const intervalId = window.setInterval(() => {
      const remainingMs = deadline - Date.now();
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      setConnectionSecondsLeft(remainingSeconds);

      if (remainingMs <= 0) {
        window.clearInterval(intervalId);
        abortConnection();
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [connectionTimedOut, esMaster, masterListo, jugadorActual, mision?.id, personaje?.id]);

  const formatConnectionTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!turnoActual?.turnoActualPersonajeId) {
      setMovimientoRoll(null);
      setAtaqueRollado(false);
      return;
    }
    const pid = turnoActual.turnoActualPersonajeId.toString();
    const entrada = dadosRoll[pid];
    setMovimientoRoll(entrada?.movimiento ?? null);
    setAtaqueRollado(entrada?.ataque != null);
  }, [turnoActual?.turnoActualPersonajeId, dadosRoll]);

  const handleMovimientoRollResult = (resultado: number) => {
    setMovimientoRoll(resultado);
    const pid = jugadorActual?.personajeId ?? jugadorActual?.id;
    if (pid != null) sendDadoMovimiento(Number(pid), resultado);
  };

  const movimientoRollRef = useRef<number | null>(null);
  movimientoRollRef.current = movimientoRoll;

  const handleMovimientoUsed = useCallback((steps: number) => {
    if (movimientoRollRef.current === null) return;
    const pid = jugadorActual?.personajeId ?? jugadorActual?.id;
    if (pid == null) return;
    const remaining = Math.max(0, movimientoRollRef.current - steps);
    setMovimientoRoll(remaining);
    sendDadoMovimiento(Number(pid), remaining);
  }, [jugadorActual, sendDadoMovimiento]);

  const handleAtaqueRollResult = (cantidadResultados: number) => {
    setAtaqueRollado(true);
    const pid = jugadorActual?.personajeId ?? jugadorActual?.id;
    if (pid != null) sendDadoAtaque(Number(pid), cantidadResultados);
  };

  const activeEnemyTokens = useMemo(() => {
    const enemyTokens = configPartida?.enemigos ?? [];
    if (enemyTokens.length === 0) return [];
    if (activeEnemyIds.size === 0) return [];
    return enemyTokens.filter(enemy => activeEnemyIds.has(enemy.instanciaId));
  }, [activeEnemyIds, configPartida?.enemigos]);

  return (
    <div className="tb-page tsm-page">
      <PanelLateralStoryMode
        modoHistoria={modoHistoria}
        mision={mision}
        personaje={personaje}
        jugadoresSincronizados={jugadoresSincronizados}
        jugadorActual={jugadorActual}
        participantes={participantes}
        enemyTokens={activeEnemyTokens}
        abierto={panelAbierto}
        onToggle={() => setPanelAbierto(!panelAbierto)}
        esMaster={esMaster}
        onMasterAbort={sendMasterAbort}
        onAbandonarConfirmado={(nombrePersonaje) => {
          sendChatMessage({ autor: 'Sistema', texto: `${nombrePersonaje} abandonó la misión` });
        }}
      />

      <TableroCentroStoryMode
        personaje={personaje}
        mision={mision}
        jugadoresSincronizados={jugadoresSincronizados}
        jugadorActual={jugadorActual}
        tokenMoves={tokenMoves}
        sendTokenMove={sendTokenMove}
        turnoActual={turnoActual}
        sendFinTurno={sendFinTurno}
        onParticipantesLoaded={setParticipantes}
        movimientoRoll={movimientoRoll}
        onMovimientoUsed={handleMovimientoUsed}
        configPartida={configPartida}
        bloqueado={esperandoMaster || connectionTimedOut}
        esMaster={esMaster}
        revealedRooms={revealedRooms}
        onRoomRevealed={sendRoomRevealed}
        onEnemyMove={sendEnemyMove}
        onMasterFinTurno={sendIniciarRonda}
        nombreMaster={nombreMaster}
        onActiveEnemiesChange={setActiveEnemyIds}
      />

      <PanelPartidaStoryMode
        nombreMaster={nombreMaster}
        jugadores={jugadoresSincronizados}
        jugadorActual={jugadorActual}
        campanaId={mision?.id}
        turnoActual={turnoActual}
        onMovimientoRollResult={handleMovimientoRollResult}
        movimientoYaLanzado={movimientoRoll !== null}
        onAtaqueRollResult={handleAtaqueRollResult}
        ataqueYaLanzado={ataqueRollado}
        chatSince={chatSince}
      />

      {esperandoMaster && !connectionTimedOut && (
        <div className="tsm-waiting-overlay">
          <div className="tsm-waiting-modal">
            <p className="tsm-waiting-text">El master está preparando la partida, por favor espera...</p>
            <p className="tsm-waiting-text">Tiempo restante: {formatConnectionTime(connectionSecondsLeft)}</p>
            <div className="gb-master-loader tsm-waiting-spinner" aria-label="Esperando al master">
              <span className="dot d1" /><span className="dot d2" /><span className="dot d3" /><span className="dot d4" />
              <span className="dot d5" /><span className="dot d6" /><span className="dot d7" /><span className="dot d8" />
            </div>
          </div>
        </div>
      )}

      <ModalAlert
        isOpen={connectionTimedOut}
        title="Conexión no establecida"
        message="No se consiguió conectar con la partida en 2 minutos. Puedes salir para volver a seleccionar tu personaje o seguir esperando un poco más."
        confirmText="Salir"
        cancelText="Seguir esperando"
        onConfirm={handleTimeoutLeave}
        onCancel={handleTimeoutKeepWaiting}
      />
    </div>
  );
}
