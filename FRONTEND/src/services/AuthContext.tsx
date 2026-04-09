import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';


export interface UserData {
  id: number;
  nombre: string;
  email: string;
  avatar?: string;
  rol?: string;
  suscripcion?: string;
  fechaAltaSuscripcion?: string;
  suscripcionActiva?: boolean;
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
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Al montar, recuperar sesión guardada
  useEffect(() => {
    const savedToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    const savedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const setUserData = (userData: UserData, userToken: string, rememberMe: boolean = false) => {
    setUser(userData);
    setToken(userToken);
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Limpiamos ambos por si acaso
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    storage.setItem('token', userToken);
    storage.setItem('user', JSON.stringify(userData));
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
    
    if (localStorage.getItem('user')) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      sessionStorage.setItem('user', JSON.stringify(newUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoggedIn: !!token && !!user,
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