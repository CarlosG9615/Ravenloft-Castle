import { API_URL, authHeaders } from './api';

export interface StatsDTO {
  fuerza: number;
  destreza: number;
  constitucion: number;
  inteligencia: number;
  sabiduria: number;
  carisma: number;
}

export interface EnemigoDetalleDTO {
  id: number;
  nombre: string;
  tipo: string;
  cr: number;
  salud: number;
  ca: number;
  stats: StatsDTO;
  fuerzaAtaque: number;
  danoAtaque: string;
  descripcion: string;
}

export const getEnemigos = async (): Promise<EnemigoDetalleDTO[]> => {
  const response = await fetch(`${API_URL}/api/enemigos`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Error al obtener enemigos');
  return await response.json();
};