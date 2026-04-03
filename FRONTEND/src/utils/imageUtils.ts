const BASE_URL = import.meta.env.VITE_CLOUDINARY_URL as string

const AVATAR_PREFIX = 'avatar_'
const CARTA_PREFIX = 'carta_'

export const getAvatarUrl = (avatar: string): string =>
  `${BASE_URL}/${AVATAR_PREFIX}${avatar}.png`

export const getCartaUrl = (avatar: string): string =>
  `${BASE_URL}/${CARTA_PREFIX}${avatar}.png`