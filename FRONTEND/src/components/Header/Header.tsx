import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import { getMyProfile } from '../../services/authService';
import { getMisNotificaciones, marcarComoLeida, marcarTodasComoLeidas } from '../../services/notificacionService';
import type { NotificacionDTO } from '../../services/notificacionService';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './Header.css';
import { Bell } from 'lucide-react';
import { resolveProfileAvatar } from '../../utils/avatarUtils';



export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, logout, updateUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionDTO[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const stompRef = useRef<Client | null>(null);

  const [campañasOpen, setCampañasOpen] = useState(false);
  const campañasRef = useRef<HTMLDivElement>(null);

  const noLeidas = notificaciones.filter(n => !n.leida).length;
  const privateRoutes = ['/characters', '/join', '/create', '/tools'];
  const isActive = (route: string) => location.pathname === route;

  const cargarNotificaciones = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const data = await getMisNotificaciones();
      setNotificaciones(data);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (campañasRef.current && !campañasRef.current.contains(e.target as Node)) {
        setCampañasOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      getMyProfile()
        .then(perfil => {
          const nextUser: { nombre?: string; email?: string; rol?: string; avatar?: string } = {
            nombre: perfil.nombre,
            email: perfil.email,
            rol: perfil.rol,
          };
          const resolvedAvatar = resolveProfileAvatar(perfil.avatar);
          if (resolvedAvatar) nextUser.avatar = resolvedAvatar;
          updateUser(nextUser);
        })
        .catch(err => console.error('Error cargando perfil en header:', err));
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !user?.id) return;

    cargarNotificaciones();

    const client = new Client({
      webSocketFactory: () => new (SockJS as any)('http://localhost:8080/ws'),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/usuario/${user.id}/notificaciones`, (frame) => {
          const nueva: NotificacionDTO = JSON.parse(frame.body);
          setNotificaciones(prev => [nueva, ...prev]);
        });
      },
    });

    client.activate();
    stompRef.current = client;

    return () => { client.deactivate(); };
  }, [isLoggedIn, user?.id]);

  const handleNavClick = (route: string) => {
    if (privateRoutes.includes(route) && !isLoggedIn) {
      navigate('/login', { state: { from: route } });
    } else {
      navigate(route);
    }
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    navigate('/home');
  };

  const handleMarcarLeida = async (id: number) => {
    await marcarComoLeida(id);
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const handleMarcarTodas = async () => {
    await marcarTodasComoLeidas();
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
  };

  const getInitials = () => {
    if (!user?.nombre) return '?';
    return user.nombre.charAt(0).toUpperCase();
  };

  const formatFecha = (fecha: string) => {
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const getIconoNotif = (tipo: string) => {
    if (tipo === 'UNION_CAMPANA') return '⚔';
    if (tipo === 'SEGUIMIENTO') return '👤';
    return '🔔';
  };

  return (
    <header className="header">

      <nav className="nav-menu">
        <a className={'nav-link' + (isActive('/home') ? ' active' : '')}
          onClick={() => handleNavClick('/home')}
        >
          Inicio
        </a>
        <a className={'nav-link' + (isActive('/characters') ? ' active' : '')}
        onClick={() => handleNavClick('/characters')}
        >
        Personajes
        </a>


        {/* ── DESPLEGABLE CAMPAÑAS ── */}
  <div className="nav-dropdown-wrap" ref={campañasRef}>
    
    <a  className={`nav-link ${campañasOpen ? 'active' : ''}`}
      onClick={() => setCampañasOpen(!campañasOpen)}
    >
      Campañas ▾
    </a>
      {campañasOpen && (
      <div className="nav-dropdown">
        <a className="nav-dropdown-item" onClick={() => { navigate('/create'); setCampañasOpen(false); }}>
          Crear Sala
        </a>
        <a className="nav-dropdown-item" onClick={() => { navigate('/join'); setCampañasOpen(false); }}>
          Unirte a una Partida
        </a>
        {isLoggedIn && (
          <a className="nav-dropdown-item" onClick={() => { navigate('/mis-campanas'); setCampañasOpen(false); }}>
            Mis Campañas
          </a>
        )}
      </div>
    )}
  </div>
    <a  className={'nav-link' + (isActive('/subscription') ? ' active' : '')}
    onClick={() => handleNavClick('/subscription')}
    >
    Planes
  </a>

      </nav>

      <div className="header-actions">
        <button className="icon-btn-clean" title="Idioma">🌐</button>

        {isLoggedIn && user ? (
          <>
            {/* ── CAMPANA NOTIFICACIONES ── */}
            <div className="notif-wrap" ref={notifRef}>
              <button
                className="notif-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                title="Notificaciones"
              >
                <Bell size={22} color="rgba(255,255,255,0.8)" />
                {noLeidas > 0 && (
                  <span className="notif-badge">{noLeidas}</span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span className="notif-titulo">Notificaciones</span>
                    {noLeidas > 0 && (
                      <button className="notif-leer-todas" onClick={handleMarcarTodas}>
                        Marcar todas
                      </button>
                    )}
                  </div>

                  <div className="notif-lista">
                    {notificaciones.length === 0 && (
                      <p className="notif-vacio">Sin notificaciones</p>
                    )}
                    {notificaciones.length > 0 && (
                      <>
                        {notificaciones.map(n => (
                          <div
                            key={n.id}
                            className={`notif-item ${n.leida ? 'leida' : 'no-leida'}`}
                            onClick={() => !n.leida && handleMarcarLeida(n.id)}
                          >
                            <div className="notif-icono">{getIconoNotif(n.tipo)}</div>
                            <div className="notif-contenido">
                              <p className="notif-mensaje">{n.mensaje}</p>
                              <span className="notif-fecha">{formatFecha(n.fecha)}</span>
                            </div>
                            {!n.leida && <div className="notif-punto" />}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── USUARIO ── */}
            <div className="user-menu" ref={dropdownRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="user-avatar">
                  {user.avatar
                    ? <img src={user.avatar} alt={user.nombre} />
                    : <span className="user-initials">{getInitials()}</span>
                  }
                </div>
                <span className="user-name">{user.nombre}</span>
                <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▾</span>
              </button>

              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-content">
                    <div className="dropdown-profile">
                      <div className="dropdown-avatar">
                        {user.avatar
                          ? <img src={user.avatar} alt={user.nombre} />
                          : <span>{getInitials()}</span>
                        }
                      </div>
                      <div className="dropdown-profile-text">
                        <div className="dropdown-greeting">¡Hola, {user.nombre}!</div>
                        <div className="dropdown-email">{user.email}</div>
                      </div>
                    </div>
                    <div className="dropdown-actions">
                      <button className="dropdown-item" onClick={() => { navigate('/profile'); setDropdownOpen(false); }}>
                        Mi Perfil
                      </button>
                      <button className="dropdown-item dropdown-item--danger" onClick={handleLogout}>
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <button className="login-btn" onClick={() => navigate('/login')}>
            <img
              src="/images/icons/icon-castle.png"
              alt="castle"
              style={{ width: '20px', height: '20px', mixBlendMode: 'screen', filter: 'brightness(2)' }}
            />
            <span>Login</span>
          </button>
        )}
      </div>

      {/* MENÚ MÓVIL */}
      {mobileMenuOpen && (
  <div className="mobile-menu">
    <a className={'mobile-nav-link' + (isActive('/home') ? ' active' : '')} onClick={() => handleNavClick('/home')}>Inicio</a>
    <a className={'mobile-nav-link' + (isActive('/characters') ? ' active' : '')} onClick={() => handleNavClick('/characters')}>Personajes</a>
    <a className="mobile-nav-link" onClick={() => handleNavClick('/create')}>Crear Sala</a>
    <a className="mobile-nav-link" onClick={() => handleNavClick('/join')}>Unirte a una Partida</a>
    {isLoggedIn && (
      <a className="mobile-nav-link" onClick={() => { navigate('/mis-campanas'); setMobileMenuOpen(false); }}>Mis Campañas</a>
    )}
    <a className={'mobile-nav-link' + (isActive('/subscription') ? ' active' : '')} onClick={() => handleNavClick('/subscription')}>Planes</a>
    {isLoggedIn && (
      <>
        <div className="dropdown-divider" style={{ margin: '8px 16px' }} />
        <a className="mobile-nav-link" onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}>Mi Perfil</a>
        <a className="mobile-nav-link mobile-nav-link--danger" onClick={handleLogout}>Cerrar Sesión</a>
      </>
    )}
  </div>
)}  
    </header>
  );
}