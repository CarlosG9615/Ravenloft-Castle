import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../../services/ThemeContext';
import './Header.css';

interface NavItem {
  label: string;
  route: string;
}

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { label: 'Inicio',           route: '/' },
    { label: 'Personajes', route: '/characters' },
    { label: 'Herramientas', route: '/tools' },
    { label: 'Unirte a una Partida', route: '/join' },
    { label: 'Crear Sala', route: '/create' }
  ];

  const isActive = (route: string) => location.pathname === route;

  return (
    <header className="header">
      

      <nav className="nav-menu">
        {navItems.map((item) => {
          const navLinkClass = 'nav-link' + (isActive(item.route) ? ' active' : '');
          
          return (
            <a
              key={item.route}
              className={navLinkClass}
              onClick={() => navigate(item.route)}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="header-actions">
        

         <button className="icon-btn-clean" title="Idioma">
              🌐
          </button>
          <button className="login-btn" onClick={() => navigate('/login')}>
            <img 
            src="/images/icons/icon-castle.png" 
            alt="castle" 
            style={{ width: '20px', 
            height: '20px', 
            mixBlendMode: 'screen',
            filter: 'brightness(2)' 
            }} 
            />
            <span>Login</span>
          </button>
       
      </div>

      <button 
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          {navItems.map((item) => {
            const mobileLinkClass = 'mobile-nav-link' + (isActive(item.route) ? ' active' : '');
            return (
              <a key={item.route} className={mobileLinkClass} onClick={() => {
                navigate(item.route);
                setMobileMenuOpen(false);
                }}
              >
                {item.label}
              </a>
            );
          })}
        </div>
      )}
    </header>
  );
}