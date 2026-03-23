import { API_URL, authHeaders } from './api';

// LISTAR personajes del usuario logueado
export const getPersonajes = async () => {
  const response = await fetch(`${API_URL}/api/personajes`, {
    headers: authHeaders(),
  });

  if (!response.ok) throw new Error('Error al obtener personajes');
  return await response.json();
};

// OBTENER un personaje por id
export const getPersonaje = async (id: number) => {
  const response = await fetch(`${API_URL}/api/personajes/${id}`, {
    headers: authHeaders(),
  });

  if (!response.ok) throw new Error('Error al obtener el personaje');
  return await response.json();
};

// CREAR personaje
export const createPersonaje = async (datos: {
  nombre: string;
  clase: string;
  raza: string;
  nivel: number;
  fuerza: number;
  destreza: number;
  constitucion: number;
  inteligencia: number;
  sabiduria: number;
  carisma: number;
  puntosGolpeMax: number;
  puntosGolpeActual: number;
  claseArmadura: number;
  iniciativa: number;
  velocidad: number;
  bonificacionCompetencia: number;
  alineamiento: string;
  usuarioId: number;
}) => {
  const response = await fetch(`${API_URL}/api/personajes`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });

  if (!response.ok) throw new Error('Error al crear el personaje');
  return await response.json();
};

// ACTUALIZAR personaje
export const updatePersonaje = async (id: number, datos: any) => {
  const response = await fetch(`${API_URL}/api/personajes/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(datos),
  });

  if (!response.ok) throw new Error('Error al actualizar el personaje');
  return await response.json();
};