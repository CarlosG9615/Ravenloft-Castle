import { useState } from 'react';
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

  // Sincronizar jugadores por misión vía WebSocket
  const { jugadoresSincronizados, conectado, tokenMoves, sendTokenMove, turnoActual, sendFinTurno } = useStoryModeSync(
    mision?.id,
    jugadorActual,
    jugadores
  );
  void conectado;

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
      />

      <PanelPartidaStoryMode
        nombreMaster={personaje?.nombre ?? 'Personaje'}
        jugadores={jugadoresSincronizados}
        jugadorActual={jugadorActual}
        campanaId={mision?.id}
      />
    </div>
  );
}
