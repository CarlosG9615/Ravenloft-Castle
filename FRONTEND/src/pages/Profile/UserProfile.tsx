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
import { getPersonajes } from '../../services/personajeService';
import { MagicEdit, AvatarCircle} from 'pixelarticons/react'
import { Sword } from 'lucide-react';
import { resolveProfileAvatar } from '../../utils/avatarUtils';

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

function calcularNivel(suscripcion: SuscripcionDTO | null, numCampanas: number, numPersonajes: number): number {
  let nivel = 1;
  if (suscripcion && suscripcion.estado === 'ACTIVA' && suscripcion.tipo !== 'BASICA') nivel += 2;
  nivel += numCampanas;
  nivel += numPersonajes;
  return nivel;
}

function getNombreNivel(nivel: number): string {
  if (nivel <= 2) return 'Aldeano';
  if (nivel <= 4) return 'Aventurero';
  if (nivel <= 6) return 'Veterano';
  if (nivel <= 9) return 'Héroe';
  if (nivel <= 12) return 'Campeón';
  return 'Leyenda';
}

export function UserProfile() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('perfil');
  const [suscripcionActual, setSuscripcionActual] = useState<SuscripcionDTO | null>(null);
  const [mostrarAvatares, setMostrarAvatares] = useState(false);
  const [avatarSeleccionado, setAvatarSeleccionado] = useState(resolveProfileAvatar(user?.avatar) ?? '');
  const [campanas, setCampanas] = useState<any[]>([]);
  const [personajes, setPersonajes] = useState<any[]>([]);
  const [fechaRegistro, setFechaRegistro] = useState<string>('');

  const [nombre, setNombre] = useState(user?.nombre ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);

  const normalizeAvatarForSave = (value: string) => {
    if (!value) return value;
    if (value.startsWith('/images/avatars/')) {
      return value.split('/').pop() ?? value;
    }
    return value;
  };

  const handleGuardarAvatar = async (nextAvatar: string) => {
    if (!nextAvatar) {
      setError('Selecciona un avatar antes de guardar');
      return;
    }
    setError('');
    setSuccess('');
    setSavingAvatar(true);
    try {
      const avatarPayload = normalizeAvatarForSave(nextAvatar);
      const response = await updateProfile({ avatar: avatarPayload });
      const resolvedAvatar = resolveProfileAvatar(response?.avatar ?? avatarPayload) ?? nextAvatar;
      updateUser({ avatar: resolvedAvatar });
      setAvatarSeleccionado(resolvedAvatar);
      setMostrarAvatares(false);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar el avatar');
    } finally {
      setSavingAvatar(false);
    }
  };

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
    getMyProfile()
      .then(perfil => {
        const resolvedAvatar = resolveProfileAvatar(perfil.avatar) ?? user?.avatar;
        const nextUser: { nombre?: string; email?: string; avatar?: string; rol?: string } = {
          nombre: perfil.nombre,
          email: perfil.email,
          rol: perfil.rol,
        };
        if (resolvedAvatar) nextUser.avatar = resolvedAvatar;
        updateUser(nextUser);
        setAvatarSeleccionado(resolvedAvatar ?? '');
        if (perfil.fechaRegistro) {
          const fecha = new Date(perfil.fechaRegistro);
          setFechaRegistro(fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }));
        }
      })
      .catch(err => console.error('Error cargando perfil:', err));

    cargarSuscripciones();

    // Cargar campañas
    fetch('http://localhost:8080/api/campanas/mis-campanas', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      }
    })
      .then(r => r.json())
      .then(data => setCampanas(Array.isArray(data) ? data : []))
      .catch(() => setCampanas([]));

    // Cargar personajes
    getPersonajes()
      .then(data => setPersonajes(Array.isArray(data) ? data : []))
      .catch(() => setPersonajes([]));

  }, [user?.id]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const nivel = calcularNivel(suscripcionActual, campanas.length, personajes.length);
  const nombreNivel = getNombreNivel(nivel);
  const xpActual = nivel * 100;
  const xpSiguiente = (nivel + 1) * 100;
  const porcentajeXP = ((nivel % 1) * 100) || 60;

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

  const cancelConfirm = () => setShowConfirmModal(false);

  return (
    <div className="profile-page">
      <BackButton />
      <div className="profile-bg" />

      <div className="profile-container">

        {/* ── HERO ── */}
        <div className="profile-hero">
          {/* AVATAR */}
          <div
            className="profile-avatar-wrap"
            onClick={() => setMostrarAvatares(!mostrarAvatares)}
          >
            {avatarSeleccionado
              ? <img src={avatarSeleccionado} alt={user.nombre} className="profile-avatar-img" />
              : <div className="profile-avatar-placeholder">{getInitials()}</div>
            }
            
            {mostrarAvatares && (
              <div className="profile-avatar-picker" onClick={e => e.stopPropagation()}>
                {AVATARES.map(src => (
                  <img
                    key={src}
                    src={src}
                    alt="avatar"
                    className={`profile-avatar-opcion ${avatarSeleccionado === src ? 'seleccionado' : ''}`}
                    onClick={() => {
                      setAvatarSeleccionado(src);
                      handleGuardarAvatar(src);
                    }}
                  />
                ))}
                <button
                  className="profile-avatar-guardar"
                  disabled={savingAvatar}
                  onClick={() => handleGuardarAvatar(avatarSeleccionado)}
                >
                  {savingAvatar ? 'Guardando...' : 'Guardar avatar'}
                </button>
              </div>
            )}
          </div>

          {/* INFO PRINCIPAL */}
          <div className="profile-hero-info">
            <div className="profile-hero-top">
              <h1 className="profile-username">{user.nombre}</h1>
              <span className="profile-rol-badge">{user.rol ?? 'usuario'}</span>
            </div>
            <p className="profile-email">{user.email}</p>
            {fechaRegistro && (
              <p className="profile-fecha">⚔ Aventurero desde {fechaRegistro}</p>
            )}

            {/* NIVEL */}
            <div className="profile-nivel-wrap">
              <div className="profile-nivel-info">
                <span className="profile-nivel-label">Nivel {nivel}</span>
                <span className="profile-nivel-nombre">{nombreNivel}</span>
              </div>
              <div className="profile-xp-barra">
                <div className="profile-xp-fill" style={{ width: `${porcentajeXP}%` }} />
              </div>
            </div>
          </div>

          {/* STATS RÁPIDOS */}
          <div className="profile-stats-rapidos">
            <div className="profile-stat-rapido">
              <span className="profile-stat-num">{campanas.length}</span>
              <span className="profile-stat-label">Campañas</span>
            </div>
            <div className="profile-stat-rapido">
              <span className="profile-stat-num">{personajes.length}</span>
              <span className="profile-stat-label">Personajes</span>
            </div>
            <div className="profile-stat-rapido">
              <span className="profile-stat-num">{nivel}</span>
              <span className="profile-stat-label">Nivel</span>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${tab === 'perfil' ? 'active' : ''}`}
            onClick={() => setTab('perfil')}
          >
            <AvatarCircle /> Mi Perfil
          </button>
          <button
            className={`profile-tab ${tab === 'editar' ? 'active' : ''}`}
            onClick={() => setTab('editar')}
          >
            <MagicEdit /> Editar Perfil
          </button>
        </div>

        {/* ── CONTENIDO ── */}
        <div className="profile-content">

          {tab === 'perfil' && (
            <div className="profile-perfil-grid">

              {success && <div className="profile-alert profile-alert--success" style={{ gridColumn: '1/-1' }}>✅ {success}</div>}
              {error && <div className="profile-alert profile-alert--error" style={{ gridColumn: '1/-1' }}>⚠ {error}</div>}

              {/* SUSCRIPCIÓN */}
              <div className="profile-card profile-card--full">
                <div className="profile-card-titulo">Estado de Suscripción</div>
                <div className="profile-suscrip-wrap">
                  <div className="profile-suscrip-plan">
                    <span className="profile-suscrip-nombre">
                      {suscripcionActual?.nombre || user.suscripcion || 'Aventurero (Gratis)'}
                    </span>
                    <span className={`profile-suscrip-estado ${suscripcionActual?.estado === 'ACTIVA' ? 'activa' : 'inactiva'}`}>
                      {suscripcionActual?.estado === 'ACTIVA' ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  {suscripcionActual && (
                    <div className="profile-suscrip-fecha">
                      Miembro desde: {suscripcionActual.fechaAlta}
                    </div>
                  )}
                  {suscripcionActual && suscripcionActual.estado === 'ACTIVA' && (
                    <button className="profile-suscrip-baja" onClick={handleCancelarSuscripcion}>
                      Dar de baja
                    </button>
                  )}
                </div>
              </div>

              {/* CAMPAÑAS */}
              <div className="profile-card profile-card--full">
                <div className="profile-card-titulo">Mis Campañas</div>
                {campanas.length === 0 ? (
                  <p className="profile-vacio">No has participado en ninguna campaña aún</p>
                ) : (
                  <div className="profile-campanas-lista">
                    {campanas.map(c => (
                      <div key={c.id} className="profile-campana-item">
                        <div className="profile-campana-img-placeholder"><Sword /></div>
                        <div className="profile-campana-info">
                          <span className="profile-campana-nombre">{c.nombre}</span>
                          <span className="profile-campana-rol">
                            {c.masterId === user.id ? 'Master' : '⚔ Jugador'}
                          </span>
                        </div>
                        <span className={`profile-campana-estado ${c.active ? 'activa' : 'inactiva'}`}>
                          {c.active ? 'Activa' : 'Finalizada'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ACCIONES */}
              <div className="profile-card profile-card--acciones">
                <button className="profile-action-btn" onClick={() => navigate('/characters')}>
                  Ver mis Personajes
                </button>
                <button className="profile-action-btn profile-action-btn--danger" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </div>

            </div>
          )}

          {tab === 'editar' && (
            <form onSubmit={handleSave} className="profile-edit-form">

              {success && <div className="profile-alert profile-alert--success">✅ {success}</div>}
              {error && <div className="profile-alert profile-alert--error">⚠ {error}</div>}

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
                <button type="button" className="profile-btn-cancel" onClick={() => setTab('perfil')}>
                  Cancelar
                </button>
                <button type="submit" className="profile-btn-save" disabled={saving}>
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