import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './UserProfile.css';
import { useAuth } from '../../services/AuthContext';
import { updateProfile } from '../../services/authService';
import { BackButton } from '../../components/BackButton/BackButton';

type Tab = 'perfil' | 'editar';

export function UserProfile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('perfil');

  // Formulario editar
  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  if (!user) {
    navigate('/login');
    return null;
  }

  const getInitials = () => user.nombre?.charAt(0).toUpperCase() ?? '?';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setSaving(true);
    try {
      const payload: any = {};
      if (nombre !== user.nombre) payload.nombre = nombre;
      if (email !== user.email) payload.email = email;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        setError('No hay cambios que guardar');
        setSaving(false);
        return;
      }

      await updateProfile(payload);
      updateUser({ nombre, email });
      setSuccess('¡Perfil actualizado correctamente!');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/home');
  };

  return (
    <div className="profile-page">
      <BackButton />

      {/* FONDO */}
      <div className="profile-bg" />

      <div className="profile-container">

        {/* CABECERA */}
        <div className="profile-header">
          <div className="profile-avatar-wrap">
            {user.avatar
              ? <img src={user.avatar} alt={user.nombre} className="profile-avatar-img" />
              : <div className="profile-avatar-placeholder">{getInitials()}</div>
            }
          </div>
          <div className="profile-hero-info">
            <h1 className="profile-username">{user.nombre}</h1>
            <p className="profile-email">{user.email}</p>
            {user.rol && (
              <span className="profile-rol-badge">{user.rol}</span>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${tab === 'perfil' ? 'active' : ''}`}
            onClick={() => setTab('perfil')}
          >
            ⚔️ Mi Perfil
          </button>
          <button
            className={`profile-tab ${tab === 'editar' ? 'active' : ''}`}
            onClick={() => setTab('editar')}
          >
            ✏️ Editar Perfil
          </button>
        </div>

        {/* CONTENIDO */}
        <div className="profile-content">

          {/* ── TAB PERFIL ── */}
          {tab === 'perfil' && (
            <div className="profile-info-grid">
              <div className="profile-info-card">
                <div className="profile-info-label">Nombre de Aventurero</div>
                <div className="profile-info-value">{user.nombre}</div>
              </div>
              <div className="profile-info-card">
                <div className="profile-info-label">Correo de Contacto</div>
                <div className="profile-info-value">{user.email}</div>
              </div>
              <div className="profile-info-card">
                <div className="profile-info-label">Rango en el Castillo</div>
                <div className="profile-info-value">{user.rol ?? 'Aventurero'}</div>
              </div>
              <div className="profile-info-card profile-info-card--action">
                <button
                  className="profile-action-btn"
                  onClick={() => navigate('/characters')}
                >
                  📜 Ver mis Personajes
                </button>
                <button
                  className="profile-action-btn profile-action-btn--danger"
                  onClick={handleLogout}
                >
                  🚪 Cerrar Sesión
                </button>
              </div>
            </div>
          )}

          {/* ── TAB EDITAR ── */}
          {tab === 'editar' && (
            <form onSubmit={handleSave} className="profile-edit-form">

              {success && <div className="profile-alert profile-alert--success">✅ {success}</div>}
              {error   && <div className="profile-alert profile-alert--error">⚠ {error}</div>}

              <div className="profile-field">
                <label className="profile-label">Nombre de Usuario</label>
                <input
                  type="text"
                  className="profile-input"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  required
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Correo Electrónico</label>
                <input
                  type="email"
                  className="profile-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="profile-divider-text">
                Cambiar contraseña (deja en blanco para no cambiarla)
              </div>

              <div className="profile-field">
                <label className="profile-label">Nueva Contraseña</label>
                <input
                  type="password"
                  className="profile-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div className="profile-field">
                <label className="profile-label">Confirmar Contraseña</label>
                <input
                  type="password"
                  className="profile-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="profile-form-actions">
                <button
                  type="button"
                  className="profile-btn-cancel"
                  onClick={() => setTab('perfil')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="profile-btn-save"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}