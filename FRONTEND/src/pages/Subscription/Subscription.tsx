import './Subscription.css';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles, Sword } from 'lucide-react';
import { useAuth } from '../../services/AuthContext';
import { createSuscripcion, getUserSuscripciones } from '../../services/suscripcionService';
import { useState, useEffect } from 'react';

export function Subscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    if (user?.id) {
      getUserSuscripciones(user.id)
        .then((suscripciones) => {
          const active = suscripciones.some(s => s.estado === 'ACTIVA');
          setHasActiveSubscription(active);
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
      await createSuscripcion({
        usuarioId: user.id,
        nombre: nombrePlan,
        tipo
      });
      navigate('/profile');
    } catch (e: any) {
      console.error(e);
      let errorMsg = 'Error al elegir tu suscripción. Inténtalo más tarde.';
      try {
        const errObj = JSON.parse(e.message);
        if (errObj.mensaje) errorMsg = errObj.mensaje;
      } catch {
        if (e.message && !e.message.startsWith('Error al')) {
           errorMsg = e.message;
        }
      }
      alert(errorMsg);
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
        {/* Plan Aventurero */}
        <div className="plan-card">
          <div className="plan-header">
            <Sword className="plan-icon" size={32} />
            <h2>Aventurero</h2>
            <div className="plan-price">
              <span className="amount">Gratis</span>
            </div>
            <p className="plan-desc">Lo esencial para comenzar tu viaje.</p>
          </div>
          <ul className="plan-features">
            <li> Creación de 3 personajes</li>
            <li>Acceso a campañas públicas</li>
            <li>Ficha básica de personaje</li>
            <li>Dado virtual estándar</li>
          </ul>
          <button
            className="plan-btn"
            onClick={() => handleSelectPlan('Aventurero', 'BASICA')}
            disabled={hasActiveSubscription}
            style={hasActiveSubscription ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {hasActiveSubscription ? 'Ya tienes un plan' : 'Comenzar'}
          </button>
        </div>

        {/* Plan Héroe (Featured) */}
        <div className="plan-card featured">
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
            onClick={() => handleSelectPlan('Héroe', 'PREMIUM')}
            disabled={hasActiveSubscription}
            style={hasActiveSubscription ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {hasActiveSubscription ? 'Ya tienes un plan' : 'Elegir Héroe'}
          </button>
        </div>

        {/* Plan Dungeon Master */}
        <div className="plan-card">
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
            onClick={() => handleSelectPlan('Dungeon Master', 'VIP')}
            disabled={hasActiveSubscription}
            style={hasActiveSubscription ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {hasActiveSubscription ? 'Ya tienes un plan' : 'Elegir DM'}
          </button>
        </div>
      </div>
    </div>
  );
}
