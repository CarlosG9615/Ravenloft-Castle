// URL base del backend
export const API_URL = 'http://localhost:8080';

// Obtener token guardado
export const getToken = (): string | null => {
  return sessionStorage.getItem('token');
};

// Headers con token
export const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
});

// Headers sin token (para login/register)
export const publicHeaders = () => ({
  'Content-Type': 'application/json',
});