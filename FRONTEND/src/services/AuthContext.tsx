import { createContext, useContext, useState, useEffect } from 'react';
import { API_URL, isTokenExpired } from './api';
import type { ReactNode } from 'react';
import { resolveProfileAvatar } from '../utils/avatarUtils';


export interface UserData {
  id: number;
  nombre: string;
  email: string;
  avatar?: string;
  rol?: string;
  suscripcion?: string;
  fechaAltaSuscripcion?: string;
  suscripcionActiva?: boolean;
  fechaRegistro?: string;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoggedIn: boolean;
  setUserData: (user: UserData, token: string, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (updated: Partial<UserData>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Leer síncronamente para evitar el flash isLoggedIn=false en el primer render
  const [user, setUser] = useState<UserData | null>(() => {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw) as UserData; } catch { return null; }
  });
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('token') || sessionStorage.getItem('token')
  );

  // Limpiar storage en mount si el token ya expiró (cubre recargas con token caduco)
  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (savedToken && isTokenExpired(savedToken)) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
  }, []);

  // Auto-logout cuando cualquier llamada autenticada recibe 401 (token expirado en servidor)
  useEffect(() => {
    const handle = () => {
      setUser(null);
      setToken(null);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('rememberedEmail');
    };
    window.addEventListener('auth:token-expired', handle);
    return () => window.removeEventListener('auth:token-expired', handle);
  }, []);

  // Al montar, recuperar sesión guardada y migrar sessionStorage → localStorage
  useEffect(() => {
    const savedTokenLocal = localStorage.getItem('token');
    const savedTokenSession = sessionStorage.getItem('token');
    const savedToken = savedTokenLocal || savedTokenSession;
    const savedUserLocal = localStorage.getItem('user');
    const savedUserSession = sessionStorage.getItem('user');
    const savedUser = savedUserLocal || savedUserSession;

    // Migrar datos de sessionStorage a localStorage si todavía no están ahí
    if (!savedTokenLocal && savedTokenSession) {
      localStorage.setItem('token', savedTokenSession);
      sessionStorage.removeItem('token');
    }
    if (!savedUserLocal && savedUserSession) {
      localStorage.setItem('user', savedUserSession);
      sessionStorage.removeItem('user');
    }

    if (savedToken && savedUser) {
      // Estado ya restaurado síncronamente; nada que hacer
      return;
    }

    // Si tenemos token pero no user, intentamos recuperar el perfil desde la API
    if (savedToken && !savedUser) {
      const fetchProfile = async () => {
        try {
          const resp = await fetch(`${API_URL}/api/usuarios/me`, {
            headers: { Authorization: `Bearer ${savedToken}`, 'Content-Type': 'application/json' },
          });
          if (!resp.ok) {
            // token inválido -> limpiar
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            return;
          }
          const profile = await resp.json();
          const userData = {
            id: profile.id,
            nombre: profile.nombre ?? profile.username ?? profile.email,
            email: profile.email,
            avatar: resolveProfileAvatar(profile.avatar) ?? undefined,
            rol: profile.rol ?? undefined,
          };
          setToken(savedToken);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (e) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      };
      fetchProfile();
    }
  }, []);

  const setUserData = (userData: UserData, userToken: string, _rememberMe: boolean = false) => {
    setUser(userData);
    setToken(userToken);

    // Siempre persistir en localStorage para sobrevivir recargas y mantener el WebSocket
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberedEmail');
  };

  const updateUser = (updated: Partial<UserData>) => {
    if (!user) return;
    const newUser = { ...user, ...updated };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoggedIn: !!token && !!user && !isTokenExpired(token),
      setUserData,
      logout,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}