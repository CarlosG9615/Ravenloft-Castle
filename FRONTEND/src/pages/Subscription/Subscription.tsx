import './Subscription.css';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles, Sword } from 'lucide-react';

export function Subscription() {
  const navigate = useNavigate();

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
          <button className="plan-btn" onClick={() => navigate('/register')}>Comenzar</button>
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
          <button className="plan-btn featured-btn">Elegir Héroe</button>
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
          <button className="plan-btn">Elegir DM</button>
        </div>
      </div>
    </div>
  );
}

