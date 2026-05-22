import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createSuscripcion, type SuscripcionCreateDTO } from '../../services/suscripcionService';
import { useAuth } from '../../services/AuthContext';

export function PagoExitoso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const processPayment = async () => {
      // Evitar la doble ejecución de useEffect en React Strict Mode
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const sessionId = searchParams.get('session_id');
      const planParam = searchParams.get('plan');
      const plan: SuscripcionCreateDTO['tipo'] | null =
        planParam === 'BASICA' || planParam === 'PREMIUM' || planParam === 'VIP'
          ? planParam
          : null;
      const usuarioIdStr = searchParams.get('usuarioId');
      const usuarioId = usuarioIdStr ? parseInt(usuarioIdStr) : user?.id;

      if (!sessionId || !plan || !usuarioId) {
        setError('Datos de sesión incompletos.');
        setLoading(false);
        return;
      }

      try {
        await createSuscripcion({
          usuarioId,
          tipo: plan
        });

        // Esperar unos segundos y redirigir al perfil
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      } catch (e: any) {
        console.error(e);
        setError('Ocurrió un error al procesar tu suscripción. Contacta soporte.');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams, user, navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', color: 'white', background: '#0a0a0a' }}>
      <img src="/images/RavenLoft-logo (2).png" alt="Ravenloft Castle" style={{ width: '200px', marginBottom: '30px' }} />
      {loading ? (
        <h2>Procesando tu pago mágico...</h2>
      ) : error ? (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#e74c3c' }}>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/subscription')} style={{ marginTop: '20px', padding: '10px 20px', background: '#742514', border: 'none', color: 'white', cursor: 'pointer', borderRadius: '4px' }}>
            Volver
          </button>
        </div>
      ) : (
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#2ecc71' }}>¡Pago Exitoso!</h2>
          <p>Tu suscripción se ha aplicado correctamente. Preparando tu nueva aventura...</p>
        </div>
      )}
    </div>
  );
}
