export interface NavItem {
  id: string;
  label: string;
  icon: string;
  route: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'inicio', label: 'Inicio', icon: '🏰', route: '/home' },
  { id: 'personajes', label: 'Personajes', icon: '⚔️', route: '/characters' },
  { id: 'partidas', label: 'Partidas', icon: '📜', route: '/games' },
  { id: 'dados', label: 'Dados', icon: '🎲', route: '/dice' },
  { id: 'bestiario', label: 'Bestiario', icon: '🐉', route: '/bestiary' },
  { id: 'mapas', label: 'Mapas', icon: '🗺️', route: '/maps' },
  { id: 'ajustes', label: 'Ajustes', icon: '⚙️', route: '/settings' }
];