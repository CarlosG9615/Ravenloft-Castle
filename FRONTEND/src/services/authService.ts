import { API_URL, publicHeaders, authHeaders, fetchWithAuth } from './api';

// LOGIN — guarda token Y datos del usuario
export const login = async (email: string, password: string, rememberMe: boolean = false) => {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: publicHeaders(),
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Email o contraseña incorrectos');
  }

  const data = await response.json();

  const userData = {
    id: data.id ?? data.userId ?? data.usuario?.id,
    nombre: data.nombre ?? data.username ?? data.usuario?.nombre,
    email: data.email ?? data.usuario?.email,
    avatar: data.avatar ?? data.usuario?.avatar ?? null,
    rol: data.rol ?? data.role ?? data.usuario?.rol,
  };

  const storage = rememberMe ? localStorage : sessionStorage;
  
  // Limpiamos ambos storages primero
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Guardamos token y datos en el storage adecuado
  storage.setItem('token', data.token);
  storage.setItem('user', JSON.stringify(userData));

  return { token: data.token, user: userData };
};

// REGISTER
export const register = async (nombre: string, email: string, password: string) => {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: publicHeaders(),
    body: JSON.stringify({ nombre, email, password }),
  });

  if (!response.ok) {
    throw new Error('Error al crear la cuenta');
  }

  return await response.json();
};

// LOGOUT
export const logout = () => {
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// OBTENER PERFIL del usuario logueado
export const getMyProfile = async () => {
  const response = await fetchWithAuth(`${API_URL}/api/usuarios/me`, {
    method: 'GET',
    headers: authHeaders(),
  });

  if (!response.ok) throw new Error('No se pudo cargar el perfil');
  return await response.json();
};

// ACTUALIZAR PERFIL
export const updateProfile = async (data: {
  nombre?: string;
  email?: string;
  password?: string;
  avatar?: string;
}) => {
  const response = await fetchWithAuth(`${API_URL}/api/usuarios/me`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Error al actualizar el perfil');
  return await response.json();
};