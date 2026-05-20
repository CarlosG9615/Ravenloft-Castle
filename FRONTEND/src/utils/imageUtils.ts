const BASE_URL = import.meta.env.VITE_CLOUDINARY_URL as string
const MODO_HISTORIA_VERSION = (import.meta.env.VITE_CLOUDINARY_MODO_HISTORIA_VERSION as string) ?? 'v1776078423'

const AVATAR_PREFIX = 'avatar_'
const CARTA_PREFIX = 'carta_'
const CAMPANA_PREFIX = 'campana_'
const MODO_HISTORIA_PREFIX = 'ModoHistoria_'

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

type ModoHistoriaAsset = {
  slug: string
  version?: string
}

const MODO_HISTORIA_MATCHES: Record<string, ModoHistoriaAsset> = {
  tronomuertos: { slug: 'TronoMuertos' },
  cultoluna: { slug: 'CultoLuna', version: 'v1776078423' },
  sombravampiro: { slug: 'SombraVampiro', version: 'v1776078424' },
  senorsombras: { slug: 'SeñorSombras', version: 'v1776078425' },
}

const STOPWORDS = new Set(['la', 'el', 'los', 'las', 'de', 'del', 'da', 'do', 'das', 'dos', 'y', 'en'])

const getModoHistoriaSlugParts = (titulo: string): string[] =>
  normalizarTexto(titulo)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map(palabra => palabra.trim())
    .filter(Boolean)
    .filter(palabra => !STOPWORDS.has(palabra))

const buildModoHistoriaUrl = (slug: string, version = MODO_HISTORIA_VERSION): string =>
  `${BASE_URL}/${version}/${encodeURIComponent(`${MODO_HISTORIA_PREFIX}${slug}`)}.png`

export const getAvatarUrl = (avatar: string): string =>
  `${BASE_URL}/${AVATAR_PREFIX}${avatar}.png`

export const getCartaUrl = (avatar: string): string =>
  `${BASE_URL}/${CARTA_PREFIX}${avatar}.png`

export const getCampanaUrl = (titulo: string): string => {
  const slug = CAMPANA_OVERRIDES[titulo] ?? limpiarTituloCampana(titulo)
  return `${BASE_URL}/${CAMPANA_PREFIX}${slug}.png`
}

export const getModoHistoriaImageCandidates = (titulo: string): string[] => {
  const candidatos = new Set<string>()
  const urlsExplicitas: string[] = []
  const tituloCompacto = normalizarTexto(titulo).toLowerCase().replace(/[^a-z0-9]/g, '')
  const palabrasClave = getModoHistoriaSlugParts(titulo)
  const tituloSinStopwordsCompacto = palabrasClave.join('')

  Object.entries(MODO_HISTORIA_MATCHES).forEach(([fragmento, asset]) => {
    if (tituloCompacto.includes(fragmento) || tituloSinStopwordsCompacto.includes(fragmento)) {
      urlsExplicitas.push(buildModoHistoriaUrl(asset.slug, asset.version))
      candidatos.add(asset.slug)
    }
  })

  if (palabrasClave.length > 0) {
    const capitalizadas = palabrasClave.map(
      palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1),
    )

    candidatos.add(capitalizadas.join(''))
    candidatos.add(capitalizadas.slice(0, Math.min(3, capitalizadas.length)).join(''))
    candidatos.add(capitalizadas.slice(0, Math.min(2, capitalizadas.length)).join(''))
  }

  return [...urlsExplicitas, ...Array.from(candidatos).map(slug => buildModoHistoriaUrl(slug))]
}