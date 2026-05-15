import './Subscription.css';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles, Gem } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { getUserSuscripciones, createStripeCheckoutSession } from '../../services/suscripcionService';
import { useState, useEffect } from 'react';
import { ModalAlert } from '../../components/ModalAlert/ModalAlert';

export function Subscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeSubscription, setActiveSubscription] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<{ message: string; title: string; }>({ message: '', title: '' });

  useEffect(() => {
    if (user?.id) {
      getUserSuscripciones(user.id)
        .then((suscripciones) => {
          const active = suscripciones.find(s => s.estado === 'ACTIVA');
          setActiveSubscription(active || null);
        })
        .catch(err => console.error("Error al comprobar suscripciones", err));
    }
  }, [user?.id]);

  const handleSelectPlan = async (nombrePlan: string, tipo: 'BASICA' | 'PREMIUM' | 'VIP') => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await createStripeCheckoutSession(tipo, user.id);
      if (response && response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No se pudo obtener la URL de pago.');
      }
    } catch (e: any) {
      console.error(e);
      let errorMsg = 'Error al redirigir al pago. Inténtalo más tarde.';
      try {
        const errObj = JSON.parse(e.message);
        if (errObj.mensaje) errorMsg = errObj.mensaje;
      } catch {
        if (e.message && !e.message.startsWith('Error al')) {
           errorMsg = e.message;
        }
      }
      setModalConfig({ title: '¡Atención!', message: errorMsg });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="subscription-container">
      <div className="subscription-header">
        <img src="/images/RavenLoft-logo (2).png" alt="Ravenloft Castle" className="subscription-logo" />
        <h1 className="subscription-title">Forja tu Leyenda</h1>
        <p className="subscription-subtitle">Elige el camino de tu aventura y desbloquea todo el potencial de tu campaña.</p>
      </div>

      <div className="plans-grid">
        {/* Plan Héroe (Featured) */}
        <div className="plan-card featured" style={{ position: 'relative' }}>
          {activeSubscription && activeSubscription.tipo !== 'BASICA' && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              borderRadius: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 10,
              cursor: 'not-allowed',
            }}>
              <p style={{ color: 'white', fontWeight: 'bold', textAlign: 'center', margin: 0, background: 'transparent' }}>
                Para suscribirte a otro plan debes acceder a tu perfil para darte de baja del actual
              </p>
            </div>
          )}
          <div className="plan-badge">Más Popular</div>
          <div className="plan-header">
            <Sparkles className="plan-icon" size={32} />
            <h2>Héroe</h2>
            <div className="plan-price">
              <span className="currency">€</span>
              <span className="amount">4.99</span>
              <span className="period">/mes</span>
            </div>
            <p className="plan-desc">Para aventureros dedicados.</p>
          </div>
          <ul className="plan-features">
            <li>Creación ilimitada de personajes</li>
            <li>Mapas interactivos básicos</li>
            <li>Diario de campaña avanzado</li>
            <li>Dados virtuales personalizados</li>
          </ul>
          <button
            className="plan-btn featured-btn"
            onClick={() => activeSubscription?.tipo === 'BASICA' ? navigate('/profile') : handleSelectPlan('Héroe', 'BASICA')}
            disabled={!!activeSubscription && activeSubscription.tipo !== 'BASICA'}
            style={activeSubscription && activeSubscription.tipo !== 'BASICA' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {activeSubscription?.tipo === 'BASICA' ? 'Plan Actual' : 'Elegir Héroe'}
          </button>
        </div>

        {/* Plan Dungeon Master */}
        <div className="plan-card" style={{ position: 'relative' }}>
          {activeSubscription && activeSubscription.tipo !== 'PREMIUM' && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              borderRadius: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 10,
              cursor: 'not-allowed',
            }}>
              <p style={{ color: 'white', fontWeight: 'bold', textAlign: 'center', margin: 0, background: 'transparent' }}>
                Para suscribirte a otro plan debes acceder a tu perfil para darte de baja del actual
              </p>
            </div>
          )}
          <div className="plan-header">
            <Crown className="plan-icon" size={32} />
            <h2>Dungeon Master</h2>
            <div className="plan-price">
              <span className="currency">€</span>
              <span className="amount">9.99</span>
              <span className="period">/mes</span>
            </div>
            <p className="plan-desc">Todo el poder para crear mundos.</p>
          </div>
          <ul className="plan-features">
            <li>Todo el contenido del plan Héroe</li>
            <li>Creación ilimitada de campañas</li>
          </ul>
          <button
            className="plan-btn"
            onClick={() => activeSubscription?.tipo === 'PREMIUM' ? navigate('/profile') : handleSelectPlan('Dungeon Master', 'PREMIUM')}
            disabled={!!activeSubscription && activeSubscription.tipo !== 'PREMIUM'}
            style={activeSubscription && activeSubscription.tipo !== 'PREMIUM' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {activeSubscription?.tipo === 'PREMIUM' ? 'Plan Actual' : 'Elegir DM'}
          </button>
        </div>

        {/* Plan Archimago */}
        <div className="plan-card" style={{ position: 'relative' }}>
          {activeSubscription && activeSubscription.tipo !== 'VIP' && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              borderRadius: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 10,
              cursor: 'not-allowed',
            }}>
              <p style={{ color: 'white', fontWeight: 'bold', textAlign: 'center', margin: 0, background: 'transparent' }}>
                Para suscribirte a otro plan debes acceder a tu perfil para darte de baja del actual
              </p>
            </div>
          )}
          <div className="plan-header">
            <Gem className="plan-icon" size={32} />
            <h2>Archimago</h2>
            <div className="plan-price">
              <span className="currency">€</span>
              <span className="amount">19.99</span>
              <span className="period">/mes</span>
            </div>
            <p className="plan-desc">El máximo poder para crear mundos épicos.</p>
          </div>
          <ul className="plan-features">
            <li>Todo el contenido del plan Dungeon Master</li>
            <li>Campañas activas ilimitadas + 20 plazas extra</li>
            <li>Co-Master con permisos avanzados</li>
            <li>Biblioteca premium y 5 GB de recursos</li>
            <li>Automatizaciones y macros avanzadas</li>
            <li>Salas persistentes 24/7</li>
          </ul>
          <button
            className="plan-btn"
            onClick={() => activeSubscription?.tipo === 'VIP' ? navigate('/profile') : handleSelectPlan('Archimago', 'VIP')}
            disabled={!!activeSubscription && activeSubscription.tipo !== 'VIP'}
            style={activeSubscription && activeSubscription.tipo !== 'VIP' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {activeSubscription?.tipo === 'VIP' ? 'Plan Actual' : 'Elegir Archimago'}
          </button>
        </div>
      </div>

      <ModalAlert
        isOpen={isModalOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText="Aceptar"
        onConfirm={() => setIsModalOpen(false)}
        showImage={false}
      />
    </div>
  );
}
