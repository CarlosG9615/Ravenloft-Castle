import { API_URL, authHeaders } from './api';

export interface NotificacionDTO {
  id: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  campanaId?: number;
  campanaNombre?: string;
  usuarioOrigenNombre?: string;
  usuarioOrigenAvatar?: string;
}

export const getMisNotificaciones = async (): Promise<NotificacionDTO[]> => {
  const response = await fetch(`${API_URL}/api/notificaciones/mis-notificaciones`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Error al obtener notificaciones');
  return await response.json();
};

export const contarNoLeidas = async (): Promise<number> => {
  const response = await fetch(`${API_URL}/api/notificaciones/no-leidas`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Error al contar notificaciones');
  return await response.json();
};

export const marcarComoLeida = async (id: number): Promise<void> => {
  await fetch(`${API_URL}/api/notificaciones/${id}/leer`, {
    method: 'PUT',
    headers: authHeaders(),
  });
};

export const marcarTodasComoLeidas = async (): Promise<void> => {
  await fetch(`${API_URL}/api/notificaciones/leer-todas`, {
    method: 'PUT',
    headers: authHeaders(),
  });
};