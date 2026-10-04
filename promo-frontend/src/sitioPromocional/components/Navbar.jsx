import React, { useState, useEffect, useCallback } from 'react';
import { FaStethoscope, FaPhone, FaBars, FaTimes, FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { CLINIC_NAME, CLINIC_WHATSAPP, PLATFORM_URL, buildPlatformUrl } from '../config/constants';

function Navbar() {
  const { tPromo, language } = useLanguage();
  const { theme, isAutomatic } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CLINIC_WHATSAPP.replace(/\s/g, '')}`, '_blank');
  };

  const scrollToSection = useCallback((id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const themeParam = isAutomatic ? 'auto' : theme;
  const navClass = `promo-navbar ${scrolled ? 'promo-navbar--scrolled' : 'promo-navbar--top'}`;

  return (
    <header className={navClass} data-scrolled={scrolled}>
      <div className="promo-navbar-inner promo-container">
        <a href="#main-content" className="promo-navbar-logo" onClick={() => setMenuOpen(false)}>
          <span className="promo-navbar-logo-icon">
            <FaStethoscope />
          </span>
          <span className="promo-navbar-logo-text">
            <strong>{CLINIC_NAME.split(' ').slice(0, 2).join(' ')}</strong>
            <small>{CLINIC_NAME.split(' ').slice(2).join(' ')}</small>
          </span>
        </a>

        <nav className="promo-navbar-links" id="navbar-links" aria-label={tPromo('navMenuAria') || 'Principal'}>
          <a href="#inicio" className="promo-navbar-link" onClick={() => scrollToSection('inicio')}>{tPromo('navInicio')}</a>
          <a href="#servicios" className="promo-navbar-link" onClick={() => scrollToSection('servicios')}>{tPromo('navServicios')}</a>
          <a href="#sobre-nosotros" className="promo-navbar-link" onClick={() => scrollToSection('sobre-nosotros')}>{tPromo('navSobreNos')}</a>
          <a href="#testimonios" className="promo-navbar-link" onClick={() => scrollToSection('testimonios')}>{tPromo('navTestimonios')}</a>
          <a href="#contacto" className="promo-navbar-link" onClick={() => scrollToSection('contacto')}>{tPromo('navContacto')}</a>
        </nav>

        <div className="promo-navbar-actions">
          <a
            href={`https://wa.me/${CLINIC_WHATSAPP.replace(/\s/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="promo-navbar-whatsapp"
            aria-label={tPromo('navWhatsApp')}
          >
            <FaWhatsapp />
          </a>
          <a
            href={buildPlatformUrl(PLATFORM_URL, { language, theme: themeParam })}
            className="promo-navbar-cta"
            rel="noopener"
          >
            {tPromo('navLogin')}
          </a>
          <button
            className="promo-navbar-toggle"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? tPromo('ariaCloseMenu') : tPromo('ariaOpenMenu')}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`promo-navbar-mobile ${menuOpen ? 'promo-navbar-mobile--open' : ''}`}>
        <nav className="promo-navbar-mobile-nav" aria-label={tPromo('navMenuAria') || 'Mobile'}>
          <a href="#inicio" className="promo-navbar-mobile-link" onClick={() => scrollToSection('inicio')}>{tPromo('navInicio')}</a>
          <a href="#servicios" className="promo-navbar-mobile-link" onClick={() => scrollToSection('servicios')}>{tPromo('navServicios')}</a>
          <a href="#sobre-nosotros" className="promo-navbar-mobile-link" onClick={() => scrollToSection('sobre-nosotros')}>{tPromo('navSobreNos')}</a>
          <a href="#testimonios" className="promo-navbar-mobile-link" onClick={() => scrollToSection('testimonios')}>{tPromo('navTestimonios')}</a>
          <a href="#contacto" className="promo-navbar-mobile-link" onClick={() => scrollToSection('contacto')}>{tPromo('navContacto')}</a>
          <a
            href={buildPlatformUrl(PLATFORM_URL, { language, theme: themeParam })}
            className="promo-navbar-mobile-cta"
            rel="noopener"
            onClick={() => setMenuOpen(false)}
          >
            {tPromo('navLogin')}
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
