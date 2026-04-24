import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Auth.css';
import { register } from '../../services/authService';
import { BackButton } from '../../components/BackButton/BackButton';
import { ModalAlert } from '../../components/ModalAlert/ModalAlert';

export function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(username, email, password);
      // En lugar de redirigir inmediatamente, mostramos el modal
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowSuccessModal(false);
    navigate('/login');
  };

  return (
    <div className="auth-page d-flex align-items-center justify-content-center min-vh-100">
      <BackButton />

      {/* MODAL DE ÉXITO */}
      <ModalAlert
        isOpen={showSuccessModal}
        title="¡CUENTA CREADA!"
        message="Se ha enviado un correo electrónico con las instrucciones para activar tu cuenta. Por favor, revisa tu bandeja de entrada (y la carpeta de spam) antes de iniciar sesión."
        confirmText="Ir al inicio de sesión"
        onConfirm={handleCloseModal}
        showImage={false}
      />

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

          {/* ERROR */}
          {error && (
            <div className="auth-error mb-3">
              ⚠ {error}
            </div>
          )}

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
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
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
            <button
              type="submit"
              className="btn auth-btn-primary w-100 mb-3"
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Comenzar Aventura'}
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