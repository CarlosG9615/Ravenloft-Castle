import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import './Header.css';

interface NavItem {
  label: string;
  route: string;
}

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems: NavItem[] = [
    { label: 'Inicio',              route: '/home' },
    { label: 'Personajes',          route: '/characters' },
    { label: 'Unirte a una Partida',route: '/join' },
    { label: 'Crear Sala',          route: '/create' },
    { label: 'Comunidad',           route: '/community' },
    { label: 'Planes',              route: '/subscription' },

  ];

  // Rutas que requieren login
  const privateRoutes = ['/characters', '/join', '/create', '/tools' , '/community'];
  
  const isActive = (route: string) => location.pathname === route;

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Iniciales del usuario para el avatar si no tiene foto
  const getInitials = () => {
    if (!user?.nombre) return '?';
    return user.nombre.charAt(0).toUpperCase();
  };

  return (
    <header className="header">

      <nav className="nav-menu">
        {navItems.map((item) => {
          const navLinkClass = 'nav-link' + (isActive(item.route) ? ' active' : '');
          return (
            <a
              key={item.route}
              className={navLinkClass}
              onClick={() => handleNavClick(item.route)}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="header-actions">
        <button className="icon-btn-clean" title="Idioma">🌐</button>

        {isLoggedIn && user ? (
          /* ── USUARIO LOGUEADO: avatar + dropdown ── */
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

        ) : (
          /* ── NO LOGUEADO: botón login ── */
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
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <span></span><span></span><span></span>
      </button>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => (
            <a
              key={item.route}
              className={'mobile-nav-link' + (isActive(item.route) ? ' active' : '')}
              onClick={() => handleNavClick(item.route)}
            >
              {item.label}
            </a>
          ))}
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