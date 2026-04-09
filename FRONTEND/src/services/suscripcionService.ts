import { API_URL, authHeaders } from './api';

export interface SuscripcionDTO {
  id: number;
  usuarioId: number;
  nombre: string;
  tipo: 'BASICA' | 'PREMIUM' | 'VIP';
  estado: string;
  fechaAlta: string;
  fechaBaja?: string;
}

export interface SuscripcionCreateDTO {
  usuarioId: number;
  nombre: string;
  tipo: 'BASICA' | 'PREMIUM' | 'VIP';
}

export const createSuscripcion = async (dto: SuscripcionCreateDTO): Promise<SuscripcionDTO> => {
  const response = await fetch(`${API_URL}/api/suscripciones`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al crear la suscripción');
  }

  return response.json();
};

export const getUserSuscripciones = async (usuarioId: number): Promise<SuscripcionDTO[]> => {
  const response = await fetch(`${API_URL}/api/suscripciones/usuario/${usuarioId}`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al obtener las suscripciones del usuario');
  }

  return response.json();
};

export const cancelarSuscripcion = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/api/suscripciones/${id}/cancelar`, {
    method: 'PUT',
    headers: authHeaders(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Error al cancelar la suscripción');
  }
};
