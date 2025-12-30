const STORAGE_NAMESPACE = 'th1';
const isBrowser = typeof window !== 'undefined';

const getStorage = (): Storage | null => {
  if (!isBrowser) return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/**
 * Centralized helper for non-sensitive user preferences.
 *
 * SECURITY: Do NOT store authentication tokens, passwords, or any secrets here.
 * This utility is intended only for UI preferences such as theme, navigation
 * layout, and recent searches.
 */
export const preferenceStorage = {
  getString(key: string): string | null {
    const storage = getStorage();
    if (!storage) return null;
    return storage.getItem(`${STORAGE_NAMESPACE}:${key}`);
  },

  setString(key: string, value: string): void {
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(`${STORAGE_NAMESPACE}:${key}`, value);
  },

  remove(key: string): void {
    const storage = getStorage();
    if (!storage) return;
    storage.removeItem(`${STORAGE_NAMESPACE}:${key}`);
  },

  getJSON<T>(key: string, validator?: (value: unknown) => value is T): T | null {
    const raw = this.getString(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (validator && !validator(parsed)) {
        return null;
      }
      return parsed as T;
    } catch {
      return null;
    }
  },

  setJSON<T>(key: string, value: T): void {
    try {
      this.setString(key, JSON.stringify(value));
    } catch {
      // ignore serialization issues for preferences
    }
  },
};
