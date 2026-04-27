import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PanelLateralStoryMode } from './components/PanelLateralStoryMode';
import { PanelPartidaStoryMode } from './components/PanelPartidaStoryMode';
import { TableroCentroStoryMode } from './components/TableroCentroStoryMode';
import './TableroStoryMode.css';

export function TableroStoryMode() {
  const location = useLocation();

  const state = (location.state as any) ?? {};
  const modoHistoria = state.modoHistoria ?? null;
  const mision = state.mision ?? null;
  const personaje = state.personaje ?? null;

  const [panelAbierto, setPanelAbierto] = useState(true);

  return (
    <div className="tb-page tsm-page">
      <PanelLateralStoryMode
        modoHistoria={modoHistoria}
        mision={mision}
        personaje={personaje}
        abierto={panelAbierto}
        onToggle={() => setPanelAbierto(!panelAbierto)}
      />

      <TableroCentroStoryMode personaje={personaje} mision={mision} />

      <PanelPartidaStoryMode
        nombreMaster={personaje?.nombre ?? 'Personaje'}
      />
    </div>
  );
}
