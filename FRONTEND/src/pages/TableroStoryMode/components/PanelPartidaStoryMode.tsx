import { useLocation } from 'react-router-dom';
import { PanelPartida } from '../../Tablero/PanelPartida';
import { StoryModeDicePanel } from './StoryModeDicePanel';

interface Props {
  nombreMaster?: string;
  jugadores?: any[];
  jugadorActual?: any;
  campanaId?: number | string;
  colorMaster?: string;
  esMaster?: boolean;
}

export function PanelPartidaStoryMode({ 
  nombreMaster = 'Personaje StoryMode',
  jugadores,
  jugadorActual,
  campanaId,
  colorMaster = '#c0392b',
  esMaster = false,
}: Props) {
  const location = useLocation();
  const isStoryModeRoute = location.pathname.includes('tablero-story-mode') || location.pathname.includes('story-mode');

  return (
    <PanelPartida 
      nombreMaster={nombreMaster}
      colorMaster={colorMaster}
      jugadores={jugadores}
      jugadorActual={jugadorActual}
      campanaId={campanaId}
      esMaster={esMaster}
      dicesComponent={isStoryModeRoute ? StoryModeDicePanel : undefined}
    />
  );
}