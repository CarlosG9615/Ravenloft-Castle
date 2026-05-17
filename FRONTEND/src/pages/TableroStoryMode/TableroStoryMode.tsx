import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PanelLateralStoryMode } from './components/PanelLateralStoryMode';
import { PanelPartidaStoryMode } from './components/PanelPartidaStoryMode';
import { TableroCentroStoryMode } from './components/TableroCentroStoryMode';
import { useStoryModeSync } from './hooks/useStoryModeSync';
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

  useEffect(() => {
    if (mision?.id && jugadorActual) {
      saveSession({ modoHistoria, mision, personaje, jugadorActual });
    }
  }, [mision?.id, jugadorActual?.id ?? jugadorActual?.personajeId]);

  const chatSince = savedRef.current === null ? new Date().toISOString() : null;

  const [panelAbierto, setPanelAbierto] = useState(true);
  const [participantes, setParticipantes] = useState<{ personajeId: number; nombrePersonaje: string; nombreUsuario: string; ordenUnion?: number }[]>([]);
  const [movimientoRoll, setMovimientoRoll] = useState<number | null>(null);
  const [ataqueRollado, setAtaqueRollado] = useState(false);

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
    sendTokenMove,
    sendFinTurno,
    sendDadoMovimiento,
    sendDadoAtaque,
    sendChatMessage,
    sendMasterAbort,
  } = useStoryModeSync(mision?.id, jugadorActual, rawState.jugadores ?? [], esMaster, configPartidaInicial);
  void conectado;

  const esperandoMaster = !esMaster && masterListo !== true;

  useEffect(() => {
    if (kickedOut) {
      sessionStorage.removeItem('tsm_session');
      navigate('/join/story-mode', { replace: true });
    }
  }, [kickedOut, navigate]);

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

  return (
    <div className="tb-page tsm-page">
      <PanelLateralStoryMode
        modoHistoria={modoHistoria}
        mision={mision}
        personaje={personaje}
        jugadoresSincronizados={jugadoresSincronizados}
        jugadorActual={jugadorActual}
        participantes={participantes}
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
        bloqueado={esperandoMaster}
      />

      <PanelPartidaStoryMode
        nombreMaster={personaje?.nombre ?? jugadorActual?.nombre ?? 'Personaje'}
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

      {esperandoMaster && (
        <div className="tsm-waiting-overlay">
          <div className="tsm-waiting-modal">
            <p className="tsm-waiting-text">El master está preparando la partida, por favor espera...</p>
            <div className="gb-master-loader tsm-waiting-spinner" aria-label="Esperando al master">
              <span className="dot d1" /><span className="dot d2" /><span className="dot d3" /><span className="dot d4" />
              <span className="dot d5" /><span className="dot d6" /><span className="dot d7" /><span className="dot d8" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
