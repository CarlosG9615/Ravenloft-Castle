import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './UserProfile.css';
import { useAuth } from '../../services/AuthContext';
import { updateProfile, getMyProfile } from '../../services/authService';
import { BackButton } from '../../components/BackButton/BackButton';
import { ModalAlert } from '../../components/ModalAlert/ModalAlert';
import { getUserSuscripciones, cancelarSuscripcion } from '../../services/suscripcionService';
import type { SuscripcionDTO } from '../../services/suscripcionService';

const AVATARES = [
  '/images/avatars/caratula.png',
  '/images/avatars/elfoAvatars.png',
  '/images/avatars/proPlayer.png',
  '/images/avatars/gafotas.png',
  '/images/avatars/vampiro.png',
  '/images/avatars/principiante.png',
  '/images/avatars/magoUnisex.png',
  '/images/avatars/avatarPollito.png',
  '/images/avatars/chicaFleco.png',
];

type Tab = 'perfil' | 'editar';

export function UserProfile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('perfil');
  const [suscripcionActual, setSuscripcionActual] = useState<SuscripcionDTO | null>(null);
  const [mostrarAvatares, setMostrarAvatares] = useState(false);
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(user?.avatar ?? '');

  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const cargarSuscripciones = () => {
    if (user?.id) {
      getUserSuscripciones(user.id)
        .then((suscripciones) => {
          if (suscripciones.length > 0) {
            const activa = suscripciones.find(s => s.estado === 'ACTIVA') || suscripciones[suscripciones.length - 1];
            setSuscripcionActual(activa);
            if (activa) {
              updateUser({
                suscripcion: activa.nombre,
                suscripcionActiva: activa.estado === 'ACTIVA',
                fechaAltaSuscripcion: activa.fechaAlta
              });
            }
          } else {
            setSuscripcionActual(null);
            updateUser({ suscripcion: undefined, suscripcionActiva: false, fechaAltaSuscripcion: undefined });
          }
        })
        .catch(err => console.error("Error al cargar suscripciones", err));
    }
  };

  useEffect(() => {
    // Cargar perfil actualizado del servidor
    getMyProfile()
      .then(perfil => {
        updateUser({
          nombre: perfil.nombre,
          email: perfil.email,
          avatar: perfil.avatar,
          rol: perfil.rol,
        });
        setAvatarSeleccionado(perfil.avatar ?? '');
      })
      .catch(err => console.error('Error cargando perfil:', err));

    cargarSuscripciones();
  }, [user?.id]);

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

  const handleCancelarSuscripcion = async () => {
    if (suscripcionActual && suscripcionActual.estado === 'ACTIVA') {
      setShowConfirmModal(true);
    }
  };

  const confirmCancelarSuscripcion = async () => {
    setShowConfirmModal(false);
    try {
      await cancelarSuscripcion(suscripcionActual!.id);
      setSuccess('Suscripción cancelada correctamente.');
      setError('');
      cargarSuscripciones();
      setTimeout(() => setSuccess(''), 5000);
    } catch (e: any) {
      setError(e.message || 'Error al cancelar la suscripción');
      setSuccess('');
    }
  };

  const cancelConfirm = () => {
    setShowConfirmModal(false);
  };

  return (
    <div className="profile-page">
      <BackButton />

      <div className="profile-bg" />

      <div className="profile-container">

        {/* CABECERA */}
        <div className="profile-header">
          <div
            className="profile-avatar-wrap"
            onClick={() => setMostrarAvatares(!mostrarAvatares)}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            {avatarSeleccionado
              ? <img src={avatarSeleccionado} alt={user.nombre} className="profile-avatar-img" />
              : <div className="profile-avatar-placeholder">{getInitials()}</div>
            }
            <div className="profile-avatar-edit">✏️</div>

            {mostrarAvatares && (
              <div className="profile-avatar-picker" onClick={e => e.stopPropagation()}>
                {AVATARES.map(src => (
                  <img
                    key={src}
                    src={src}
                    alt="avatar"
                    className={`profile-avatar-opcion ${avatarSeleccionado === src ? 'seleccionado' : ''}`}
                    onClick={() => setAvatarSeleccionado(src)}
                  />
                ))}
                <button
                  className="profile-avatar-guardar"
                  onClick={async () => {
                    try {
                      await updateProfile({ avatar: avatarSeleccionado });
                      updateUser({ avatar: avatarSeleccionado });
                      setMostrarAvatares(false);
                      setSuccess('¡Avatar actualizado!');
                      setTimeout(() => setSuccess(''), 3000);
                    } catch (err) {
                      console.error('Error actualizando avatar:', err);
                    }
                  }}
                >
                  Guardar avatar
                </button>
              </div>
            )}
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

              {success && (
                <div className="profile-alert profile-alert--success" style={{ gridColumn: '1 / -1' }}>
                  ✅ {success}
                </div>
              )}
              {error && (
                <div className="profile-alert profile-alert--error" style={{ gridColumn: '1 / -1' }}>
                  ⚠ {error}
                </div>
              )}

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

              <div className="profile-info-card profile-subscription-card">
                <div className="profile-info-label">Estado de Suscripción</div>
                <div className="profile-info-value" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: 'var(--orange-fire, #f97316)' }}>
                      Plan {suscripcionActual?.nombre || user.suscripcion || 'Aventurero (Gratis)'}
                    </span>
                    <span style={{
                      fontSize: '0.8rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '15px',
                      backgroundColor: (suscripcionActual && suscripcionActual.estado === 'ACTIVA') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: (suscripcionActual && suscripcionActual.estado === 'ACTIVA') ? '#4ade80' : '#f87171',
                      border: `1px solid ${(suscripcionActual && suscripcionActual.estado === 'ACTIVA') ? '#22c55e' : '#ef4444'}`
                    }}>
                      {(suscripcionActual && suscripcionActual.estado === 'ACTIVA') ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#aaa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{suscripcionActual ? `Miembro desde: ${suscripcionActual.fechaAlta}` : 'No tienes un plan activo'}</span>
                    {suscripcionActual && suscripcionActual.estado === 'ACTIVA' && suscripcionActual.tipo !== 'BASICA' && (
                      <button
                        onClick={handleCancelarSuscripcion}
                        style={{
                          background: 'transparent',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '5px',
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                      >
                        Dar de baja
                      </button>
                    )}
                  </div>
                </div>
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

      <ModalAlert
        isOpen={showConfirmModal}
        title="¿VAS A ABANDONAR LA AVENTURA?"
        message="¿Estás seguro de que deseas dar de baja tu suscripción? Perderás los beneficios de este plan."
        confirmText="Confirmar Cancelación"
        cancelText="¡No, me quedo!"
        onConfirm={confirmCancelarSuscripcion}
        onCancel={cancelConfirm}
      />
    </div>
  );
}