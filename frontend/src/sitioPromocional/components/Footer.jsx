import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaWhatsapp, FaStethoscope, FaArrowRight } from 'react-icons/fa';
import { useLanguage } from '../../context/PromoLanguageContext';
import { CLINIC_NAME, CLINIC_ADDRESS, CLINIC_PHONE, CLINIC_EMAIL, PLATFORM_URL, REGISTRO_URL } from '../config/constants';

function Footer() {
  const { tPromo, language } = useLanguage();
  const currentYear = new Date().getFullYear();
  
  const formatWhatsApp = (phone) => {
    return phone.replace(/\s/g, '');
  };

  return (
    <footer className="promo-footer">
      <div className="promo-footer-content">
        <div className="promo-footer-brand">
          <h3 style={{ color: '#ffffff', display: 'flex', alignItems: 'center', margin: 0, padding: 0 }}>
            <FaStethoscope style={{ marginRight: '0.5rem', color: '#ffffff' }} />
            {CLINIC_NAME}
          </h3>
          <p>
            {tPromo('footerDescription')}
          </p>
          <div className="promo-footer-social">
            <a href="#" aria-label="Facebook">
              <FaFacebook />
            </a>
            <a href="#" aria-label="Instagram">
              <FaInstagram />
            </a>
            <a href={`https://wa.me/${formatWhatsApp(CLINIC_PHONE)}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <FaWhatsapp />
            </a>
          </div>
        </div>
        
        <div className="promo-footer-section">
          <h4>{tPromo('navInicio')}</h4>
          <div className="promo-footer-links">
            <a href={PLATFORM_URL}>
              <FaArrowRight style={{ marginRight: '0.5rem', fontSize: '0.75rem' }} />
              {tPromo('navLogin')}
            </a>
            <a href={REGISTRO_URL}>
              <FaArrowRight style={{ marginRight: '0.5rem', fontSize: '0.75rem' }} />
              {tPromo('ctaRegister')}
            </a>
            <a href="#servicios">
              <FaArrowRight style={{ marginRight: '0.5rem', fontSize: '0.75rem' }} />
              {tPromo('navServicos')}
            </a>
            <a href="#contacto">
              <FaArrowRight style={{ marginRight: '0.5rem', fontSize: '0.75rem' }} />
              {tPromo('navContacto')}
            </a>
          </div>
        </div>
        
        <div className="promo-footer-section">
          <h4>{tPromo('navServicos')}</h4>
          <div className="promo-footer-links">
            <a href="#servicios">{tPromo('footerServices').consulta}</a>
            <a href="#servicios">{tPromo('footerServices').cardiologia}</a>
            <a href="#servicios">{tPromo('footerServices').emergencias}</a>
            <a href="#servicios">{tPromo('footerServices').vacinacao}</a>
            <a href="#servicios">{tPromo('footerServices').analise}</a>
          </div>
        </div>
        
        <div className="promo-footer-section">
          <h4>{tPromo('contactTitle')}</h4>
          <div className="promo-footer-links">
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{tPromo('contactAddress')}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{tPromo('contactPhone')}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{tPromo('contactEmail')}</p>
          </div>
        </div>
      </div>
      
      <div className="promo-footer-bottom">
        <p>{tPromo('footerCopyright')}</p>
        <p style={{ marginTop: '0.5rem' }}>
          {tPromo('footerDesigned')}
        </p>
      </div>
    </footer>
  );
}

export default Footer;