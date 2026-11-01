import React from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaEnvelope, FaPhone, FaMapMarkerAlt, FaWhatsapp } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useInView } from '../hooks/useInView';
import { CONFIG } from '../config/constants';

function Footer() {
  const { tPromo, translations } = useLanguage();
  const [ref, isInView] = useInView({ threshold: 0.05 });

  const year = new Date().getFullYear();

  const promoTranslations = translations || {};
  const servicesList = Object.entries(promoTranslations.footerServices || {});
  const whatsappMessage = promoTranslations.footerWhatsappMessage || '';
  const whatsappUrl = `https://wa.me/244947711002?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <footer
      ref={ref}
      className={`promo-footer ${isInView ? 'animate-in' : ''}`}
      role="contentinfo"
    >
      <div className="promo-footer-content">
        <div className={`promo-footer-brand ${isInView ? 'animate-fade-left' : ''}`}>
          <div className="promo-footer-logo">
            <div className="promo-footer-logo-icon">✓</div>
            <span className="promo-footer-logo-text">MisProyectos</span>
          </div>
          <p>
            {tPromo('footerBrandText')}
          </p>
          <a className="promo-footer-home-link" href="#inicio">
            {tPromo('navInicio')}
          </a>
          <div className="promo-footer-social">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={tPromo('footerWhatsappLabel')}
            >
              <FaWhatsapp />
            </a>
          </div>
        </div>

        <div className={`promo-footer-column ${isInView ? 'animate-fade-up' : ''}`}>
          <h4>
            <a className="promo-footer-section-link" href="#servicios">
              {tPromo('footerServicesTitle')}
            </a>
          </h4>
          <ul className="promo-footer-links">
            <li key="sobre-nosotros">
              <a href="#sobre-nosotros">
                <FaArrowRight />
                {tPromo('footerAboutTitle')}
              </a>
            </li>
            {servicesList.map(([key, title]) => (
              <li key={`servico-${key}`}>
                <a href="#servicios">
                  <FaArrowRight />
                  {title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={`promo-footer-column ${isInView ? 'animate-fade-up' : ''}`}>
          <h4>{tPromo('footerLegalTitle')}</h4>
          <ul className="promo-footer-links">
            <li key="privacy">
              <Link to="/privacidad" aria-label={tPromo('footerPrivacy')}>
                <FaArrowRight />
                {tPromo('footerPrivacy')}
              </Link>
            </li>
            <li key="terms">
              <Link to="/terminos" aria-label={tPromo('footerTerms')}>
                <FaArrowRight />
                {tPromo('footerTerms')}
              </Link>
            </li>
          </ul>
        </div>

        <div className={`promo-footer-column ${isInView ? 'animate-fade-right' : ''}`}>
          <h4>
            <a className="promo-footer-section-link" href="#contacto">
              {tPromo('footerContactTitle')}
            </a>
          </h4>
          <ul className="promo-footer-links">
            <li>
              <a href={`mailto:${CONFIG.contact.email}`} aria-label={tPromo('footerEmailLabel')}>
                <FaEnvelope />
                {CONFIG.contact.email}
              </a>
            </li>
            <li>
              <a href={`tel:${CONFIG.contact.phone.replace(/\s/g, '')}`}>
                <FaPhone />
                {CONFIG.contact.phone}
              </a>
            </li>
            <li>
              <a href={`https://maps.google.com/?q=Benfica+Luanda+Angola`} target="_blank" rel="noopener noreferrer">
                <FaMapMarkerAlt />
                {CONFIG.contact.address}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className={`promo-footer-bottom ${isInView ? 'animate-fade-up' : ''}`}>
        <p>© {year} MisProyectos. {tPromo('footerRights')}</p>
        <p>{tPromo('footerCredit')}</p>
      </div>
    </footer>
  );
}

export default Footer;
