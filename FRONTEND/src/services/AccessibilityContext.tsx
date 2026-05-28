import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useAccessibilityBtn } from '../hooks/useAccessibilityBtn';

interface AccessibilityContextValue {
  enabled: boolean;
  toggleAccessibility: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { enabled, toggleAccessibility } = useAccessibilityBtn(user?.id);

  const value = useMemo(
    () => ({ enabled, toggleAccessibility }),
    [enabled, toggleAccessibility]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility debe usarse dentro de AccessibilityProvider');
  }

  return context;
}
