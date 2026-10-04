import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { FaSun, FaMoon, FaAdjust } from 'react-icons/fa';

// ATENCIÓN: Este componente replica exactamente ThemeToggle.jsx del dashboard.
// Cualquier cambio visual en el original debe replicarse aquí.
// Sólo se adaptó el import path de useTheme (../../context/ThemeContext).

const ThemeToggle = () => {
  const { theme, toggleTheme, setThemeAutomatic, isAutomatic } = useTheme();
  const [isRotating, setIsRotating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setIsRotating(true);
    const timer = setTimeout(() => setIsRotating(false), 500);
    return () => clearTimeout(timer);
  }, [theme]);

  const styles = {
    container: {
      position: 'relative',
      display: 'inline-block',
    },
    button: {
      background: 'var(--bg-secondary)',
      border: '2px solid var(--border-color)',
      borderRadius: '50%',
      width: '55px',
      height: '55px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      color: 'var(--text-primary)',
      transition: 'all 0.3s ease',
      boxShadow: 'var(--box-shadow)',
      outline: 'none',
      padding: 0,
      minWidth: 'clamp(45px, 10vw, 55px)',
    },
    icon: {
      fontSize: 'clamp(14px, 3vw, 20px)',
      transition: 'transform 0.3s ease, color 0.3s ease',
      transform: isRotating ? 'rotate(90deg)' : 'rotate(0)',
    },
    autoIndicator: {
      position: 'absolute',
      bottom: 'clamp(1px, 1vw, 2px)',
      right: 'clamp(1px, 1vw, 2px)',
      width: 'clamp(10px, 2vw, 12px)',
      height: 'clamp(10px, 2vw, 12px)',
      borderRadius: '50%',
      backgroundColor: '#10b981',
      border: 'clamp(1px, 0.5vw, 2px) solid var(--bg-secondary)',
      transition: 'all 0.3s ease',
    },
    tooltip: {
      position: 'absolute',
      bottom: 'clamp(50px, 10vw, 70px)',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      padding: 'clamp(6px, 1vw, 8px) clamp(10px, 2vw, 12px)',
      borderRadius: '6px',
      fontSize: 'clamp(10px, 1.5vw, 12px)',
      whiteSpace: 'nowrap',
      border: '1px solid var(--border-color)',
      pointerEvents: 'none',
      opacity: showTooltip ? 1 : 0,
      transition: 'opacity 0.2s ease',
      zIndex: 1000,
      boxShadow: 'var(--box-shadow)',
    },
  };

  const buttonStyle = {
    ...styles.button,
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    boxShadow: isHovered ? 'var(--box-shadow-hover)' : 'var(--box-shadow)',
    backgroundColor: isHovered ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
    borderColor: isAutomatic
      ? (isHovered ? '#10b981' : 'var(--border-color)')
      : (isHovered ? 'var(--color-admin)' : 'var(--border-color)'),
  };

  const iconStyle = {
    ...styles.icon,
    color: isAutomatic
      ? '#8b5cf6'
      : (theme === 'light' ? '#fbbf24' : '#3b82f6'),
    filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
  };

  const tooltipText = isAutomatic
    ? 'Modo automático (sigue preferencia del navegador)'
    : 'Clic derecho para modo automático';

  const handleRightClick = (e) => {
    e.preventDefault();
    setThemeAutomatic();
  };

  return (
    <div style={styles.container}>
      <button
        onClick={toggleTheme}
        onContextMenu={handleRightClick}
        onMouseEnter={() => { setIsHovered(true); setShowTooltip(true); }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowTooltip(false);
        }}
        onMouseOver={() => setShowTooltip(true)}
        style={buttonStyle}
        aria-label={isAutomatic
          ? 'Modo automático'
          : (theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro')}
        title={isAutomatic
          ? 'Clic izquierdo para manual. Clic derecho para automático.'
          : 'Clic izquierdo para cambiar tema. Clic derecho para automático.'}
      >
        {isAutomatic ? (
          <FaAdjust style={iconStyle} />
        ) : (theme === 'light' ? (
          <FaMoon style={iconStyle} />
        ) : (
          <FaSun style={iconStyle} />
        ))}
      </button>
      {isAutomatic && <div style={styles.autoIndicator} />}
      <div style={styles.tooltip}>{tooltipText}</div>
    </div>
  );
};

export default ThemeToggle;
