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

  // 1) Si tenemos token, siempre mandamos Authorization
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }

  // 2) Si es multipart, no mandamos Content-Type para que el browser lo establezca automáticamente
  if (isMultipart) {
    return headers;
  }

  // 3) Si no es multipart, mandamos Content-Type por defecto
  headers.append('Content-Type', 'application/json');
  return headers;
};
