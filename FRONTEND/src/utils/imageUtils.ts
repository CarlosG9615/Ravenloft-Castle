const BASE_URL = import.meta.env.VITE_CLOUDINARY_URL as string

const AVATAR_PREFIX = 'avatar_'
const CARTA_PREFIX = 'carta_'
const CAMPANA_PREFIX = 'campana_'

const normalizarTexto = (valor: string) =>
  valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const limpiarTituloCampana = (titulo: string) => {
  const palabrasIgnoradas = new Set(['la', 'el', 'los', 'las', 'de', 'del', 'da', 'do', 'das', 'dos'])
  const palabras = normalizarTexto(titulo)
    .split(/\s+/)
    .map(palabra => palabra.trim())
    .filter(Boolean)
    .filter(palabra => !palabrasIgnoradas.has(palabra.toLowerCase()))

  return palabras
    .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
    .join('')
}

const CAMPANA_OVERRIDES: Record<string, string> = {
  'La Maldición del Dragón Esmeralda': 'MaldicionDragonEsmeralda',
  'Los Secretos de Mirkwood': 'SecretosMirkwood',
  'El Dungeon Olvidado': 'DungeonOlvidado',
  'Inicio del Aventurero': 'InicioAventurero',
  'La Torre del Hechicero Loco': 'TorreHechicero',
  'Piratas del Mar de las Espadas': 'PiratasDelMar',
}

export const getAvatarUrl = (avatar: string): string =>
  `${BASE_URL}/${AVATAR_PREFIX}${avatar}.png`

export const getCartaUrl = (avatar: string): string =>
  `${BASE_URL}/${CARTA_PREFIX}${avatar}.png`

export const getCampanaUrl = (titulo: string): string => {
  const slug = CAMPANA_OVERRIDES[titulo] ?? limpiarTituloCampana(titulo)
  return `${BASE_URL}/${CAMPANA_PREFIX}${slug}.png`
}