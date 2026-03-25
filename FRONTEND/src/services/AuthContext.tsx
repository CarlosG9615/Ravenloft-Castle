import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';


export interface UserData {
  id: number;
  nombre: string;
  email: string;
  avatar?: string;
  rol?: string;
}

interface AuthContextType {
  user: UserData | null;
  token: string | null;
  isLoggedIn: boolean;
  setUserData: (user: UserData, token: string) => void;
  logout: () => void;
  updateUser: (updated: Partial<UserData>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Al montar, recuperar sesión guardada
  useEffect(() => {
    const savedToken = sessionStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      }
    }
  }, []);

  const setUserData = (userData: UserData, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    sessionStorage.setItem('token', userToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('rememberedEmail');
  };

  const updateUser = (updated: Partial<UserData>) => {
    if (!user) return;
    const newUser = { ...user, ...updated };
    setUser(newUser);
    sessionStorage.setItem('user', JSON.stringify(newUser));
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