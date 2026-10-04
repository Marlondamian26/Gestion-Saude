const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const LS_LANG_KEY = 'language';
export const LS_THEME_KEY = 'theme';
export const LS_AUTO_KEY = 'theme-automatic';

export const safeStorage = {
  getItem(key, fallback = null) {
    if (!isBrowser) return fallback;
    try {
      const value = window.localStorage.getItem(key);
      return value !== null ? value : fallback;
    } catch {
      return fallback;
    }
  },

  setItem(key, value) {
    if (!isBrowser) return false;
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  removeItem(key) {
    if (!isBrowser) return false;
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

export const readLanguage = () => safeStorage.getItem(LS_LANG_KEY, 'pt');
export const writeLanguage = (lang) => safeStorage.setItem(LS_LANG_KEY, lang);

export const readTheme = () => safeStorage.getItem(LS_THEME_KEY);
export const writeTheme = (theme) => safeStorage.setItem(LS_THEME_KEY, theme);

export const readThemeAutomatic = () => safeStorage.getItem(LS_AUTO_KEY, 'true') === 'true';
export const writeThemeAutomatic = (isAuto) => safeStorage.setItem(LS_AUTO_KEY, String(isAuto));
