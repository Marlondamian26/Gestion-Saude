import React from 'react';
import { Link } from 'react-router-dom';
import { FaStethoscope, FaUser, FaNotesMedical, FaEnvelope, FaPhone, FaClock } from 'react-icons/fa';
import { useLanguage } from '../../context/PromoLanguageContext';
import { CLINIC_NAME, CLINIC_PHONE, CLINIC_WHATSAPP, PLATFORM_URL } from '../config/constants';

function Navbar() {
  const { tPromo, language, setLanguage } = useLanguage();

  const languages = [
    { code: 'pt', name: 'PT' },
    { code: 'es', name: 'ES' },
    { code: 'en', name: 'EN' }
  ];

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${CLINIC_WHATSAPP.replace(/\s/g, '')}`, '_blank');
  };

  return (
    <nav className="promo-navbar">
      <div className="promo-navbar-container">
        <Link to="/" className="promo-navbar-logo">
          <div className="promo-navbar-logo-icon">
            <FaStethoscope />
          </div>
          <span className="promo-navbar-logo-text">{CLINIC_NAME}</span>
        </Link>

        <ul className="promo-navbar-links">
          <li><a href="#inicio">{tPromo('navInicio')}</a></li>
          <li><a href="#servicios">{tPromo('navServicos')}</a></li>
          <li><a href="#sobre-nosotros">{tPromo('navSobreNos')}</a></li>
          <li><a href="#contacto">{tPromo('navContacto')}</a></li>
        </ul>

        <div className="promo-navbar-actions">
          <button className="promo-btn promo-btn-secondary" onClick={handleWhatsApp}>
            <FaPhone />
            {tPromo('navWhatsApp')}
          </button>
          <a href={PLATFORM_URL} className="promo-btn promo-navbar-cta">
            {tPromo('navLogin')}
          </a>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;