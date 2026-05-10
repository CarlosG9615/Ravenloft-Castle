// URL base del backend
// Si no quieres que Vite intercepte, usa puerto 8080 (backend) directo
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Función para obtener token del storage general
const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

// Función helper para construir headers PÚBLICOS
export const publicHeaders = () => ({
  'Content-Type': 'application/json',
});

// Headers con token
export const authHeaders = (isMultipart = false) => {
  const token = getToken();
  const headers = new Headers();

  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  if (isMultipart) {
    return headers;
  }

  headers.append('Content-Type', 'application/json');
  return headers;
};

// Decodifica el JWT y comprueba si ha expirado (sin llamada al servidor).
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    return Date.now() / 1000 > payload.exp;
  } catch {
    return true; // token malformado → tratarlo como expirado
  }
};

// Wrapper de fetch que dispara 'auth:token-expired' cuando el servidor devuelve 401.
// Usar en lugar de fetch() para todas las llamadas autenticadas.
export const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const response = await fetch(url, options);
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:token-expired'));
  }
  return response;
};
