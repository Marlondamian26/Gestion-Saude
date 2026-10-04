const LS_LANG_KEY = 'language';
const LS_THEME_KEY = 'theme';
const LS_AUTO_KEY = 'theme-automatic';

const VALID_LANGS = ['pt', 'es', 'en'];
const VALID_THEMES = ['light', 'dark', 'auto'];

export function readFromUrl() {
  const result = {};
  if (typeof window === 'undefined') return result;

  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');
  const theme = params.get('theme');

  if (lang && VALID_LANGS.includes(lang)) {
    localStorage.setItem(LS_LANG_KEY, lang);
    result.language = lang;
  }
  if (theme && VALID_THEMES.includes(theme)) {
    localStorage.setItem(LS_THEME_KEY, theme);
    if (theme === 'auto') {
      localStorage.setItem(LS_AUTO_KEY, 'true');
    } else {
      localStorage.setItem(LS_AUTO_KEY, 'false');
    }
    result.theme = theme;
  }

  if (lang || theme) {
    params.delete('lang');
    params.delete('theme');
    const cleanUrl = window.location.pathname + (params.toString() ? `?${params.toString()}` : '');
    window.history.replaceState({}, '', cleanUrl);
  }

  return result;
}

export function buildPlatformUrl(baseUrl, opts = {}) {
  const { language, theme } = opts;
  const url = new URL(baseUrl);
  if (language && VALID_LANGS.includes(language)) {
    url.searchParams.set('lang', language);
  }
  if (theme && VALID_THEMES.includes(theme)) {
    url.searchParams.set('theme', theme);
  }
  return url.toString();
}

export function buildPromoUrl(baseUrl, opts = {}) {
  return buildPlatformUrl(baseUrl, opts);
}

export { LS_LANG_KEY, LS_THEME_KEY, LS_AUTO_KEY, VALID_LANGS, VALID_THEMES };
