import { useEffect, useState } from 'react';
import type { UserData } from '../services/AuthContext';

const ACCESSIBILITY_STORAGE_PREFIX = 'ravenloft:accessibility-enabled';
const ACCESSIBILITY_BODY_CLASS = 'accessibility-enabled';

const getStorageKey = (userId?: number | null) => `${ACCESSIBILITY_STORAGE_PREFIX}:${userId ?? 'guest'}`;

const applyAccessibilityClass = (enabled: boolean) => {
  if (typeof document === 'undefined') return;
  document.body.classList.toggle(ACCESSIBILITY_BODY_CLASS, enabled);
};

export const clearAccessibilityPreference = (userId?: number | null) => {
  if (typeof localStorage !== 'undefined') {
    if (userId != null) {
      localStorage.removeItem(getStorageKey(userId));
    } else {
      for (let index = localStorage.length - 1; index >= 0; index -= 1) {
        const key = localStorage.key(index);
        if (key && key.startsWith(ACCESSIBILITY_STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  applyAccessibilityClass(false);
};

export const readAccessibilityPreference = (userId?: number | null) => {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(getStorageKey(userId)) === '1';
};

export const writeAccessibilityPreference = (userId: number | null | undefined, enabled: boolean) => {
  if (typeof localStorage !== 'undefined') {
    const storageKey = getStorageKey(userId);
    if (enabled) {
      localStorage.setItem(storageKey, '1');
    } else {
      localStorage.removeItem(storageKey);
    }
  }

  applyAccessibilityClass(enabled);
};

export function useAccessibilityBtn(userId?: UserData['id']) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const savedEnabled = readAccessibilityPreference(userId);
    setEnabled(savedEnabled);
    applyAccessibilityClass(savedEnabled);
  }, [userId]);

  const toggleAccessibility = () => {
    setEnabled(prevEnabled => {
      const nextEnabled = !prevEnabled;
      writeAccessibilityPreference(userId, nextEnabled);
      return nextEnabled;
    });
  };

  return {
    enabled,
    toggleAccessibility,
  };
}
