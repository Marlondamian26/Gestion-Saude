import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { FaSun, FaMoon, FaAdjust, FaGlobe } from 'react-icons/fa';
import '../styles/promocional.css';
import '../styles/promo-responsive.css';

import Navbar from './Navbar';
import Carousel from './Carousel';
import Hero from './Hero';
import Servicios from './Servicios';
import SobreNosotros from './SobreNosotros';
import Testimonios from './Testimonios';
import Contacto from './Contacto';
import CTA from './CTA';
import Footer from './Footer';

function PromoThemeToggle() {
  const { theme, toggleTheme, setThemeAutomatic, isAutomatic } = useTheme();
  const [isRotating, setIsRotating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    setIsRotating(true); // theme-driven animation trigger
    const timer = setTimeout(() => setIsRotating(false), 500);
    return () => clearTimeout(timer);
  }, [theme]);

  const buttonStyle = {
    background: 'var(--bg-secondary)',
    border: 'clamp(1px, 0.5vw, 2px) solid var(--border-color)',
    borderRadius: '50%',
    width: 'clamp(45px, 10vw, 55px)',
    height: 'clamp(45px, 10vw, 55px)',
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
    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
    boxShadowValue: isHovered ? 'var(--box-shadow-hover)' : 'var(--box-shadow)',
    backgroundColor: isHovered ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
    '--tw-border-opacity': 1,
    borderColor: isAutomatic
      ? (isHovered ? '#10b981' : 'var(--border-color)')
      : 'var(--border-color)',
  };

  const iconStyle = {
    fontSize: 'clamp(14px, 3vw, 20px)',
    transition: 'transform 0.3s ease, color 0.3s ease',
    transform: isRotating ? 'rotate(90deg)' : 'rotate(0)',
    color: isAutomatic
      ? '#8b5cf6'
      : (theme === 'light' ? '#fbbf24' : '#3b82f6'),
    filter: isHovered ? 'brightness(1.2)' : 'brightness(1)',
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    setThemeAutomatic();
  };

  const tooltipText = isAutomatic
    ? 'Auto'
    : 'Toggle theme';

  let computedStyle = {
    ...buttonStyle,
    boxShadow: buttonStyle.boxShadowValue,
  };
  delete computedStyle.boxShadowValue;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={toggleTheme}
        onContextMenu={handleRightClick}
        onMouseEnter={() => { setIsHovered(true); setShowTooltip(true); }}
        onMouseLeave={() => { setIsHovered(false); setShowTooltip(false); }}
        onMouseOver={() => setShowTooltip(true)}
        style={computedStyle}
        aria-label={
          isAutomatic
            ? 'Modo automático'
            : (theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro')
        }
        title={
          isAutomatic
            ? 'Clic izquierdo para manual. Clic derecho para automático.'
            : 'Clic izquierdo para cambiar tema. Clic derecho para automático.'
        }
      >
        {isAutomatic ? (
          <FaAdjust style={iconStyle} />
        ) : (theme === 'light' ? (
          <FaMoon style={iconStyle} />
        ) : (
          <FaSun style={iconStyle} />
        ))}
      </button>
      {isAutomatic && (
        <div style={{
          position: 'absolute',
          bottom: 'clamp(1px, 1vw, 2px)',
          right: 'clamp(1px, 1vw, 2px)',
          width: 'clamp(10px, 2vw, 12px)',
          height: 'clamp(10px, 2vw, 12px)',
          borderRadius: '50%',
          backgroundColor: '#10b981',
          border: 'clamp(1px, 0.5vw, 2px) solid var(--bg-secondary)',
          transition: 'all 0.3s ease',
        }} />
      )}
      <div style={{
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
      }}>{tooltipText}</div>
    </div>
  );
}

function PromoLanguageToggle() {
  const { language, setLanguage, tPromo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const languages = [
    { code: 'pt', name: tPromo('portuguese') || 'Portugués', flag: '🇧🇷' },
    { code: 'es', name: tPromo('spanish') || 'Español', flag: '🇪🇸' },
    { code: 'en', name: tPromo('english') || 'English', flag: '🇺🇸' },
  ];

  const currentLang = languages.find((l) => l.code === language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (langCode) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  const buttonStyle = {
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
    outline: 'none',
    padding: 0,
    minWidth: 'clamp(45px, 10vw, 55px)',
  };

  const flagStyle = {
    fontSize: 'clamp(16px, 4vw, 24px)',
    color: '#8b5cf6',
  };

  const iconStyle = {
    fontSize: 'clamp(10px, 2vw, 14px)',
    color: 'var(--text-muted)',
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '60px',
    right: '0',
    width: 'clamp(160px, 18vw, 200px)',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    boxShadow: 'var(--box-shadow-hover)',
    zIndex: 1001,
    overflow: 'hidden',
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={buttonStyle}
        title={tPromo('changeLanguage') || 'Cambiar idioma'}
        aria-label={tPromo('changeLanguage') || 'Cambiar idioma'}
      >
        <span style={flagStyle}>{currentLang.flag}</span>
        <span style={iconStyle}>
          <FaGlobe />
        </span>
      </button>

      {isOpen && (
        <div style={dropdownStyle}>
          <div style={{
            padding: '12px 15px',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-tertiary)',
          }}>
            <span style={{
              fontSize: 'clamp(10px, 1.5vw, 12px)',
              fontWeight: '600',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>{tPromo('language') || 'Idioma'}</span>
          </div>
          <div style={{ padding: '5px' }}>
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'clamp(8px, 2vw, 10px)',
                  width: '100%',
                  padding: 'clamp(8px, 2vw, 10px) clamp(10px, 2vw, 12px)',
                  backgroundColor: language === lang.code ? 'var(--color-patient)' : 'transparent',
                  color: language === lang.code ? '#ffffff' : 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: 'clamp(12px, 2vw, 14px)',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 'clamp(14px, 3vw, 16px)' }}>{lang.flag}</span>
                <span style={{ flex: 1 }}>{lang.name}</span>
                {language === lang.code && (
                  <span style={{ fontSize: 'clamp(10px, 2vw, 12px)', fontWeight: 'bold' }}>✓</span>
                )}
              </button>
            ))}
          </div>
          <div style={{
            padding: 'clamp(6px, 1vw, 8px) clamp(10px, 2vw, 12px)',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-tertiary)',
            textAlign: 'center',
          }}>
            <small style={{
              fontSize: 'clamp(8px, 1.5vw, 10px)',
              color: 'var(--text-muted)',
              fontStyle: 'italic',
            }}>{tPromo('changeLanguage') || 'Cambiar idioma'}</small>
          </div>
        </div>
      )}
    </div>
  );
}

function LandingWrapper() {
  const { theme } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="sitio-promocional" data-theme={theme}>
      <div className="promo-floating-toggles">
        <PromoThemeToggle />
        <PromoLanguageToggle />
      </div>

      <Navbar />

      <main className="promo-main">
        <section id="inicio">
          <Carousel />
        </section>

        <section id="inicio-content">
          <Hero />
        </section>

        <Servicios />
        <SobreNosotros />
        <Testimonios />
        <Contacto />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

export default LandingWrapper;
