import React, { useId } from 'react';
import { FaSearch } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

const container = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  maxWidth: '440px',
};

const icon = {
  position: 'absolute',
  left: '10px',
  color: 'var(--text-muted)',
  pointerEvents: 'none',
  fontSize: '16px',
};

const input = {
  width: '100%',
  paddingLeft: '34px',
  padding: '10px 12px',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'var(--border-color)',
  borderRadius: '6px',
  fontSize: '16px',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
};

const clearButton = {
  position: 'absolute',
  right: '8px',
  background: 'none',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: '18px',
  lineHeight: '1',
  padding: '2px',
  borderRadius: '4px',
};

const counter = {
  marginTop: '6px',
  fontSize: '13px',
  color: 'var(--text-muted)',
};

/**
 * Cuadro de búsqueda reutilizable para las secciones de gestión del
 * AdminDashboard. Accesible: label asociado, type="search",
 * aria-describedby con el contador y contador con aria-live="polite".
 *
 * Contrato:
 * - `value` (string): valor controlado del input.
 * - `onChange(value: string)`: se invoca con el string tecleado (no con el
 *   evento nativo). El padre es responsable de actualizar `value`.
 * - `onClear()`: se invoca al pulsar el botón limpiar.
 */
const UserSearchBar = ({
  value = '',
  onChange,
  onClear,
  placeholder,
  resultCount = 0,
  totalCount = 0,
  query = '',
  label,
}) => {
  const { t } = useLanguage();
  const id = useId();
  const inputId = `admin-search-${id}`;
  const counterId = `admin-search-counter-${id}`;
  const hasValue = value && value.trim().length > 0;

  const counterText = hasValue
    ? t('searchResultsFor', { resultCount, query })
    : t('searchResults', { resultCount, totalCount });

  return (
    <div style={container}>
      <label style={srOnly} htmlFor={inputId}>
        {label || t('searchUsersLabel')}
      </label>
      <FaSearch style={icon} />
      <input
        id={inputId}
        type="search"
        aria-label={label || t('searchUsersLabel')}
        aria-describedby={counterId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || t('searchUsersPlaceholder')}
        autoComplete="off"
        spellCheck={false}
        style={input}
      />
      {hasValue && (
        <button
          type="button"
          onClick={onClear}
          aria-label={t('clearSearch')}
          title={t('clearSearch')}
          style={clearButton}
        >
          ×
        </button>
      )}
      <span id={counterId} style={counter} aria-live="polite">
        {counterText}
      </span>
    </div>
  );
};

UserSearchBar.displayName = 'UserSearchBar';

export default UserSearchBar;
