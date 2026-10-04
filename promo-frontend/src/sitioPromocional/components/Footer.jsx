import React from 'react';
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaYoutube, FaArrowRight, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useInView } from '../hooks/useInView';
import { CONFIG } from '../config/constants';

function Footer() {
  const { tPromo, language } = useLanguage();
  const [ref, isInView] = useInView({ threshold: 0.05 });

  const year = new Date().getFullYear();

  const currentLang = language === 'pt' ? 'pt' : 'en';

  const footerLinks = [
    { title: tPromo('footerServicesTitle'), href: `/#servicios?lang=${currentLang}` },
    { title: tPromo('footerAboutTitle') || tPromo('footerServicesTitle'), href: `/#sobre-nosotros?lang=${currentLang}` },
    { title: tPromo('footerContactTitle'), href: `/#contacto?lang=${currentLang}` },
    { title: tPromo('footerPrivacy'), href: `?lang=${currentLang}&page=privacy` },
    { title: tPromo('footerTerms'), href: `?lang=${currentLang}&page=terms` },
  ];

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
          <div className="promo-footer-social">
            {CONFIG.social?.facebook && (
              <a
                href={CONFIG.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tPromo('socialFacebook')}
              >
                <FaFacebookF />
              </a>
            )}
            {CONFIG.social?.instagram && (
              <a
                href={CONFIG.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tPromo('socialInstagram')}
              >
                <FaInstagram />
              </a>
            )}
            {CONFIG.social?.linkedin && (
              <a
                href={CONFIG.social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tPromo('socialLinkedin')}
              >
                <FaLinkedinIn />
              </a>
            )}
            {CONFIG.social?.youtube && (
              <a
                href={CONFIG.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={tPromo('socialYoutube')}
              >
                <FaYoutube />
              </a>
            )}
          </div>
        </div>

        <div className={`promo-footer-column ${isInView ? 'animate-fade-up' : ''}`}>
          <h4>{tPromo('footerServicesTitle')}</h4>
          <ul className="promo-footer-links">
            {footerLinks.slice(0, 3).map((link) => (
              <li key={link.href}>
                <a href={link.href}>
                  <FaArrowRight />
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={`promo-footer-column ${isInView ? 'animate-fade-up' : ''}`}>
          <h4>{tPromo('footerLegalTitle')}</h4>
          <ul className="promo-footer-links">
            {footerLinks.slice(3).map((link) => (
              <li key={link.href}>
                <a href={link.href}>
                  <FaArrowRight />
                  {link.title}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className={`promo-footer-column ${isInView ? 'animate-fade-right' : ''}`}>
          <h4>{tPromo('footerContactTitle')}</h4>
          <ul className="promo-footer-links">
            <li>
              <a href={`mailto:${CONFIG.contact.email}`}>
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
