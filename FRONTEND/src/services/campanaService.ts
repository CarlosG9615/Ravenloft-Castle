import { API_URL, authHeaders } from './api';

export interface CampanaRequest {
  nombre: string;
  descripcion: string;
  calcDistancia?: string;
  logo: string | null;
  imagen: string | null;
  mapasSeleccionados: number[];
}

export interface CampanaResponse {
  id: number;
  nombre: string;
  descripcion: string;
  calcDistancia: string;
  logo: string | null;
  imagen: string | null;
  masterId: number;
  masterNombre: string;
  mapasSeleccionados: number[];
  dificultad: 'Fácil' | 'Media' | 'Difícil' | 'Épica';
  maxJugadores: number;
  numSesiones: number;
  nivelMinimo: number;
  sistema: string;
  active: boolean;
}

export const crearCampana = async (request: CampanaRequest): Promise<CampanaResponse> => {
  const response = await fetch(`${API_URL}/api/campanas`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error('Error al crear campaña');
  }
  return response.json();
};

export const obtenerMisCampanas = async (): Promise<CampanaResponse[]> => {
  const response = await fetch(`${API_URL}/api/campanas/mis-campanas`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Error al obtener mis campañas');
  }
  return response.json();
};

export const obtenerCampanasActivas = async (): Promise<CampanaResponse[]> => {
  const response = await fetch(`${API_URL}/api/campanas`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Error al obtener campañas activas');
  }
  return response.json();
};

export const eliminarCampana = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/campanas/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error('Error al eliminar la campaña');
  }
};
