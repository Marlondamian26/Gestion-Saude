import React from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { FaGlobe } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';

const PromocionalToggle = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const isPromocional = location.pathname === '/promocional';

  const handleClick = () => {
    if (isPromocional) {
      navigate('/dashboard');
    }
  };

  if (isPromocional) {
    return (
      <button
        onClick={handleClick}
        style={styles.button}
        title={t('backToDashboard')}
        aria-label={t('backToDashboard')}
      >
        <span style={styles.icon}>
          <FaGlobe />
        </span>
      </button>
    );
  }

  return (
    <Link to="/promocional" style={styles.button} title="Ver sitio web promocional" aria-label="Ver sitio web promocional">
      <span style={styles.icon}>
        <FaGlobe />
      </span>
    </Link>
  );
};

const styles = {
  button: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-secondary)',
    border: 'clamp(1px, 0.5vw, 2px) solid var(--border-color)',
    borderRadius: '50%',
    width: 'clamp(45px, 10vw, 55px)',
    height: 'clamp(45px, 10vw, 55px)',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    transition: 'all 0.3s ease',
    boxShadow: 'var(--box-shadow)',
    padding: 0,
    minWidth: 'clamp(45px, 10vw, 55px)',
    textDecoration: 'none',
  },
  icon: {
    fontSize: 'clamp(14px, 3vw, 20px)',
    color: '#8b5cf6',
  },
};

export default PromocionalToggle;
