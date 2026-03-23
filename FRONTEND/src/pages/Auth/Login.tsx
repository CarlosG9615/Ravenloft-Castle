import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Auth.css';
import { login } from '../../services/authService';
import { useAuth } from '../../services/AuthContext';
import { API_URL, publicHeaders } from '../../services/api';
import { BackButton } from '../../components/BackButton/BackButton';


export function Login() {
  const navigate = useNavigate();
  const { setUserData } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal recuperar contraseña
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');

 

  // Al montar, recuperar email guardado si existe
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      setUserData(data.user, data.token);

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      navigate('/home', { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: publicHeaders(),
        body: JSON.stringify({ email: forgotEmail }),
      });

      if (!response.ok) throw new Error('No se pudo enviar el correo');
      setForgotSuccess('¡Correo enviado! Revisa tu bandeja de entrada.');
    } catch {
      setForgotError('No se pudo enviar el correo. Comprueba el email e inténtalo de nuevo.');
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgot = () => {
    setShowForgot(false);
    setForgotEmail('');
    setForgotSuccess('');
    setForgotError('');
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center min-vh-100">
      <BackButton />
     <div className="auth-wrapper position-relative">

        <div className="text-center">
          <img
            src="/images/RavenLoft-logo (2).png"
            alt="RavenLoft Castle"
            className="auth-logo"
            onClick={() => navigate('/home')}
          />
        </div>

        <div className="auth-card position-relative">

          <img
            src="/images/avatar-login.png"
            alt="Aventurero"
            className="auth-avatar-login"
          />

          <h1 className="auth-title text-center">Bienvenido de nuevo</h1>
          <p className="auth-subtitle text-center">El castillo te aguarda, aventurero</p>

          {error && (
            <div className="auth-error mb-3">⚠ {error}</div>
          )}

          <form onSubmit={handleSubmit}>

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

            <div className="mb-2">
              {/* Label + enlace olvidaste contraseña en la misma línea */}
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="auth-label mb-0">Contraseña</label>
                <button
                  type="button"
                  className="auth-forgot-link"
                  onClick={() => setShowForgot(true)}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
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

            {/* RECORDAR CUENTA */}
            <div className="mb-4 d-flex align-items-center gap-2">
                  <div className="form-check" style={{ margin: 0 }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="rememberMe"
                          checked={rememberMe}
                          onChange={e => setRememberMe(e.target.checked)}
                          style={{ 
                            backgroundColor: rememberMe ? 'var(--red-blood)' : 'transparent',
                            borderColor: 'rgba(255,107,53,0.5)',
                            cursor: 'pointer'
                          }}
                        />
                        <label className="form-check-label auth-remember-label" htmlFor="rememberMe">
                          Recordar mi cuenta
                        </label>
                  </div>
            </div>

            <button
              type="submit"
              className="btn auth-btn-primary w-100 mb-3"
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar al Castillo'}
            </button>

          </form>

          <div className="d-flex align-items-center gap-2 mb-3">
            <hr className="flex-grow-1 auth-divider" />
            <span className="auth-divider-text">¿No tienes cuenta?</span>
            <hr className="flex-grow-1 auth-divider" />
          </div>

          <button
            className="btn auth-btn-secondary w-100"
            onClick={() => navigate('/register')}
          >
            Crear una cuenta
          </button>

        </div>
      </div>

      {/* ── MODAL RECUPERAR CONTRASEÑA ── */}
      {showForgot && (
        <div className="forgot-overlay" onClick={closeForgot}>
          <div className="forgot-modal" onClick={e => e.stopPropagation()}>

            <button className="forgot-close" onClick={closeForgot}>✕</button>

            <div className="forgot-icon">🔑</div>
            <h2 className="forgot-title">Recuperar Contraseña</h2>
            <p className="forgot-subtitle">
              Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
            </p>

            {forgotSuccess ? (
              <div>
                <div className="forgot-success">✅ {forgotSuccess}</div>
                <button className="btn auth-btn-primary w-100 mt-3" onClick={closeForgot}>
                  Volver al Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                {forgotError && (
                  <div className="auth-error mb-3">⚠ {forgotError}</div>
                )}
                <div className="mb-4">
                  <label className="auth-label">Email</label>
                  <input
                    type="email"
                    className="form-control auth-input"
                    placeholder="tu@email.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn auth-btn-primary w-100"
                  disabled={forgotLoading}
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar enlace'}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}