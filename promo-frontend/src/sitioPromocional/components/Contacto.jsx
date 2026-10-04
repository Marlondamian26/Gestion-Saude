import React from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaArrowRight } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { CONFIG } from '../config/constants';
import { useInView } from '../hooks/useInView';

function Contacto() {
  const { tPromo } = useLanguage();
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const contactInfo = CONFIG.contact;

  const contactItems = [
    {
      icon: <FaMapMarkerAlt />,
      title: tPromo('contactAddress'),
      value: contactInfo.address,
      href: `https://maps.google.com/?q=Benfica+Luanda+Angola`,
      target: '_blank',
      rel: 'noopener noreferrer',
    },
    {
      icon: <FaPhone />,
      title: tPromo('contactPhone'),
      value: contactInfo.phone,
      href: `tel:${contactInfo.phone.replace(/\s/g, '')}`,
      target: '_self',
      rel: null,
    },
    {
      icon: <FaEnvelope />,
      title: tPromo('contactEmail'),
      value: contactInfo.email,
      href: `mailto:${contactInfo.email}`,
      target: '_self',
      rel: null,
    },
    {
      icon: <FaClock />,
      title: tPromo('contactHours'),
      value: tPromo('contactHoursValue'),
      href: null,
      target: null,
      rel: null,
    },
  ];

  return (
    <section
      ref={ref}
      className={`promo-contacto ${isInView ? 'animate-in' : ''}`}
      id="contacto"
      role="region"
      aria-labelledby="contacto-title"
    >
      <div className={`promo-section-header ${isInView ? 'animate-fade-up' : ''}`}>
        <span className="promo-eyebrow">{tPromo('contactEyebrow') || tPromo('contactTitle')}</span>
        <h2 id="contacto-title" className="promo-heading">{tPromo('contactTitle')}</h2>
        <p className="promo-body">
          {tPromo('contactSubtitle')}
        </p>
      </div>

      <div className="promo-contacto-grid">
        {contactItems.map((item, index) => {
          const cardContent = (
            <>
              <div className="promo-contacto-icon">
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.value}</p>
              {item.href && (
                <span className="promo-contacto-arrow">
                  <FaArrowRight />
                </span>
              )}
            </>
          );

          return (
            <div
              key={index}
              className={`promo-contacto-card-wrapper ${isInView ? 'animate-fade-up' : ''}`}
              style={{ animationDelay: `${index * 0.08}s` }}
            >
              {item.href ? (
                <a
                  href={item.href}
                  target={item.target}
                  rel={item.rel || undefined}
                  className="promo-contacto-card"
                >
                  {cardContent}
                </a>
              ) : (
                <div className="promo-contacto-card">
                  {cardContent}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Contacto;
