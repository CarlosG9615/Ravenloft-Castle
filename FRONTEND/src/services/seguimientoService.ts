import { API_URL, authHeaders } from './api';

export interface SeguimientoDTO {
  id: number;
  usuarioId: number;
  usuarioNombre: string;
  usuarioAvatar?: string;
  fecha: string;
}

export interface PerfilPublicoDTO {
  id: number;
  nombre: string;
  avatar?: string;
  rol: string;
  numSeguidores: number;
  numSiguiendo: number;
  yoLeSigo: boolean;
}

export const getPerfilPublico = async (usuarioId: number): Promise<PerfilPublicoDTO> => {
  const response = await fetch(`${API_URL}/api/seguimiento/${usuarioId}/perfil`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Error al obtener perfil');
  return await response.json();
};

export const seguirUsuario = async (usuarioId: number): Promise<void> => {
  await fetch(`${API_URL}/api/seguimiento/${usuarioId}/seguir`, {
    method: 'POST',
    headers: authHeaders(),
  });
};

export const dejarDeSeguir = async (usuarioId: number): Promise<void> => {
  await fetch(`${API_URL}/api/seguimiento/${usuarioId}/dejar-de-seguir`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
};

export const getSeguidores = async (usuarioId: number): Promise<SeguimientoDTO[]> => {
  const response = await fetch(`${API_URL}/api/seguimiento/${usuarioId}/seguidores`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Error al obtener seguidores');
  return await response.json();
};

export const getSiguiendo = async (usuarioId: number): Promise<SeguimientoDTO[]> => {
  const response = await fetch(`${API_URL}/api/seguimiento/${usuarioId}/siguiendo`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Error al obtener siguiendo');
  return await response.json();
};

export const getPerfilPorPersonaje = async (personajeId: number): Promise<PerfilPublicoDTO> => {
  const response = await fetch(`${API_URL}/api/seguimiento/por-personaje/${personajeId}/perfil`, {
    headers: authHeaders(),
  });
  if (!response.ok) throw new Error('Error al obtener perfil');
  return await response.json();
};