import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../services/api';

export function ActivateAccount() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetch(`${API_URL}/api/auth/activar?token=${token}`)
      .then(async (response) => {
        if (!response.ok) {
           throw new Error();
        }
        // Redirige al login con estado de éxito
        navigate('/login', { state: { activationSuccess: true } });
      })
      .catch(() => {
        // Redirige al login con estado de error
        navigate('/login', { state: { activationError: true } });
      });
  }, [token, navigate]);

  return null; // Pantalla invisible que solo hace la redirección
}
