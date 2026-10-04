import React from 'react';
import { FaUserMd, FaClock, FaHeart, FaAward } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { DOCTOR_NAME, DOCTOR_TITLE, CONFIG } from '../config/constants';
import { useInView } from '../hooks/useInView';

function SobreNosotros() {
  const { tPromo } = useLanguage();
  const [ref, isInView] = useInView({ threshold: 0.1 });

  const features = tPromo('aboutFeatures') || [];
  const statsYears = tPromo('statsYears');
  const statsPatients = tPromo('statsPatients');
  const statsSatisfaction = tPromo('statsSatisfaction');

  return (
    <section
      ref={ref}
      className={`promo-sobre ${isInView ? 'animate-in' : ''}`}
      id="sobre-nosotros"
      role="region"
      aria-labelledby="sobre-title"
    >
      <div className="promo-sobre-content">
        <div className={`promo-sobre-image ${isInView ? 'animate-fade-left' : ''}`}>
          <div className="promo-sobre-image-card">
          </div>
        </div>

        <div className={`promo-sobre-text ${isInView ? 'animate-fade-right' : ''}`}>
          <span className="promo-section-label">{tPromo('navSobreNos')}</span>
          <h2 id="sobre-title">{tPromo('aboutTitle')}</h2>
          <p>
            {tPromo('aboutDescription')}
          </p>
          <p>
            {tPromo('aboutDoctorDescription')}
          </p>

          <div className="promo-sobre-features">
            {features.map((feature, index) => (
              <div
                key={index}
                className="promo-sobre-feature"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="promo-sobre-feature-icon">
                  <FaUserMd />
                </div>
                <span>{feature.text || feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default SobreNosotros;