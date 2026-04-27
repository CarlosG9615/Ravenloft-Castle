import { PanelPartida } from '../../Tablero/PanelPartida';

interface Props {
  nombreMaster?: string;
}
export function PanelPartidaStoryMode({ nombreMaster = 'Personaje StoryMode' }: Props) {
  return <PanelPartida nombreMaster={nombreMaster} />;
}