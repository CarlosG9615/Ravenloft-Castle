import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PanelLateralStoryMode } from './components/PanelLateralStoryMode';
import { PanelPartidaStoryMode } from './components/PanelPartidaStoryMode';
import { TableroCentroStoryMode } from './components/TableroCentroStoryMode';
import { useStoryModeSync } from './hooks/useStoryModeSync';
import './TableroStoryMode.css';

export function TableroStoryMode() {
  const location = useLocation();

  const state = (location.state as any) ?? {};
  const modoHistoria = state.modoHistoria ?? null;
  const mision = state.mision ?? null;
  const personaje = state.personaje ?? null;
  const jugadores = state.jugadores ?? [];
  const jugadorActual = state.jugadorActual ?? personaje;

  const [panelAbierto, setPanelAbierto] = useState(true);
  const [participantes, setParticipantes] = useState<{ personajeId: number; nombrePersonaje: string; nombreUsuario: string; ordenUnion?: number }[]>([]);
  const [movimientoRoll, setMovimientoRoll] = useState<number | null>(null);

  const { jugadoresSincronizados, conectado, tokenMoves, sendTokenMove, turnoActual, sendFinTurno, sendChatMessage } = useStoryModeSync(
    mision?.id,
    jugadorActual,
    jugadores
  );
  void conectado;

  // Resetear el dado de movimiento al cambiar de turno
  useEffect(() => {
    setMovimientoRoll(null);
  }, [turnoActual?.turnoActualPersonajeId]);

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
      />

      <PanelPartidaStoryMode
        nombreMaster={personaje?.nombre ?? 'Personaje'}
        jugadores={jugadoresSincronizados}
        jugadorActual={jugadorActual}
        campanaId={mision?.id}
        turnoActual={turnoActual}
        onMovimientoRollResult={setMovimientoRoll}
        movimientoYaLanzado={movimientoRoll !== null}
      />
    </div>
  );
}
