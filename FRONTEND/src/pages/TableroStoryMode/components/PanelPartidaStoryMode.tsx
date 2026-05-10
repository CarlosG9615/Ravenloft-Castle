import { PanelPartida } from '../../Tablero/PanelPartida';

interface Props {
  nombreMaster?: string;
  jugadores?: any[];
  jugadorActual?: any;
  campanaId?: number | string;
}
export function PanelPartidaStoryMode({ 
  nombreMaster = 'Personaje StoryMode',
  jugadores,
  jugadorActual,
  campanaId
}: Props) {
  return (
    <PanelPartida 
      nombreMaster={nombreMaster}
      jugadores={jugadores}
      jugadorActual={jugadorActual}
      campanaId={campanaId}
    />
  );
}