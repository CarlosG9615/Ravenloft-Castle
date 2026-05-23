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
  velocidad: number;   
  iniciativa: number; 
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

export interface EnemigoResumenDTO {
  id: number;
  nombre: string;
  tipo: string;
  cr: number;
  salud: number;
  ca: number;
}

export interface ModoHistoriaEnemigoDTO {
  id: number;
  enemigo: EnemigoResumenDTO;
  cantidad: number;
  dificultad: number;
}

export const getEnemigosByModoHistoria = async (modoHistoriaId: number | string): Promise<ModoHistoriaEnemigoDTO[]> => {
  const response = await fetch(`${API_URL}/api/modos-historia/${modoHistoriaId}/enemigos`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Error al obtener enemigos del modo historia');
  return await response.json();
};