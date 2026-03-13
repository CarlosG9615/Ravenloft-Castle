import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Auth.css';

export function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log({ username, email, password });
  };

 

  return (
     <div className="auth-page d-flex align-items-center justify-content-center min-vh-100">

      {/* CONTENEDOR CENTRAL */}
      <div className="auth-wrapper position-relative">

        {/* LOGO */}
        <div className="text-center">
          <img
            src="/images/RavenLoft-logo (2).png"
            alt="RavenLoft Castle"
            className="auth-logo"
            onClick={() => navigate('/home')}
          />
        </div>

        {/* CARD */}
        <div className="auth-card position-relative">

          {/* AVATAR */}
          <img
            src="/images/avatar-register.png"
            alt="Nuevo aventurero"
            className="auth-avatar-register"
          />

          <h1 className="auth-title text-center">Crea tu cuenta</h1>
          <p className="auth-subtitle text-center">Tu leyenda comienza aquí</p>

          <form onSubmit={handleSubmit}>

            {/* NOMBRE DE USUARIO */}
            <div className="mb-3">
              <label className="auth-label">Nombre de usuario</label>
              <input
                type="text"
                className="form-control auth-input"
                placeholder="TuNombreDeAventurero"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
              />
            </div>

            {/* EMAIL */}
            <div className="mb-3">
              <label className="auth-label">Email</label>
              <input
                type="email"
                className="form-control auth-input"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            {/* CONTRASEÑA */}
            <div className="mb-4">
              <label className="auth-label">Contraseña</label>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="auth-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* BOTÓN PRINCIPAL */}
            <button type="submit" className="btn auth-btn-primary w-100 mb-3">
              Comenzar Aventura
            </button>

          </form>

          {/* DIVISOR */}
          <div className="d-flex align-items-center gap-2 mb-3">
            <hr className="flex-grow-1 auth-divider" />
            <span className="auth-divider-text">¿Ya tienes cuenta?</span>
            <hr className="flex-grow-1 auth-divider" />
          </div>

          {/* BOTÓN SECUNDARIO */}
          <button
            className="btn auth-btn-secondary w-100"
            onClick={() => navigate('/login')}
          >
            Iniciar sesión
          </button>

        </div>
      </div>
    </div>
  );
}