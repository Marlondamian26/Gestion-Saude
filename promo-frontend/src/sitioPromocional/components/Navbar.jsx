import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaStethoscope, FaPhone, FaBars, FaTimes } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { CLINIC_NAME, CLINIC_WHATSAPP, PLATFORM_URL, buildPlatformUrl } from '../config/constants';

function Navbar() {
  const { tPromo, language } = useLanguage();
  const { theme, isAutomatic } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CLINIC_WHATSAPP.replace(/\s/g, '')}`, '_blank');
  };

  const scrollToSection = (id) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="promo-navbar">
      <div className="promo-navbar-container">
        <Link to="/" className="promo-navbar-logo" onClick={() => setMenuOpen(false)}>
          <div className="promo-navbar-logo-icon">
            <FaStethoscope />
          </div>
          <span className="promo-navbar-logo-text">{CLINIC_NAME}</span>
        </Link>

        <button
          className="promo-navbar-toggle"
          aria-label={menuOpen ? tPromo('close') || 'Fechar' : tPromo('menu') || 'Menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <ul className={`promo-navbar-links ${menuOpen ? 'open' : ''}`}>
          <li><button onClick={() => scrollToSection('inicio')}>{tPromo('navInicio')}</button></li>
          <li><button onClick={() => scrollToSection('servicios')}>{tPromo('navServicos')}</button></li>
          <li><button onClick={() => scrollToSection('sobre-nosotros')}>{tPromo('navSobreNos')}</button></li>
          <li><button onClick={() => scrollToSection('testimonios')}>{tPromo('navTestimonios')}</button></li>
          <li><button onClick={() => scrollToSection('contacto')}>{tPromo('navContacto')}</button></li>
        </ul>

        <div className="promo-navbar-actions">
          <button className="promo-btn promo-btn-secondary promo-navbar-whatsapp" onClick={handleWhatsApp} aria-label={tPromo('navWhatsApp')}>
            <FaPhone />
          </button>
          <a href={buildPlatformUrl(PLATFORM_URL, { language, theme: isAutomatic ? 'auto' : theme })} className="promo-btn promo-navbar-cta" rel="noopener">
            {tPromo('navLogin')}
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;