import React from 'react';
import { FaCheck, FaUserMd, FaClock, FaHeart, FaAward } from 'react-icons/fa';
import { useLanguage } from '../../context/PromoLanguageContext';
import { DOCTOR_NAME, DOCTOR_TITLE, CONFIG } from '../config/constants';

function SobreNosotros() {
  const { tPromo } = useLanguage();

  const features = tPromo('aboutFeatures') || [];
  const statsYears = tPromo('statsYears');
  const statsPatients = tPromo('statsPatients');
  const statsSatisfaction = tPromo('statsSatisfaction');

  return (
    <section className="promo-sobre" id="sobre-nosotros">
      <div className="promo-sobre-content">
        <div className="promo-sobre-image">
          <div className="promo-sobre-image-card">
            <div className="promo-sobre-stats">
              <div className="promo-stat-item">
                <div className="promo-stat-number">+5</div>
                <div className="promo-stat-label">{statsYears} de experiencia</div>
              </div>
              <div className="promo-stat-item">
                <div className="promo-stat-number">+2000</div>
                <div className="promo-stat-label">{statsPatients} atendidos</div>
              </div>
              <div className="promo-stat-item">
                <div className="promo-stat-number">98%</div>
                <div className="promo-stat-label">{statsSatisfaction}</div>
              </div>
              <div className="promo-stat-item">
                <div className="promo-stat-number">24/7</div>
                <div className="promo-stat-label">{tPromo('statsEmergency')}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="promo-sobre-text">
          <span className="promo-section-label">{tPromo('navSobreNos')}</span>
          <h2>{tPromo('aboutTitle')}</h2>
          <p>
            {tPromo('aboutDescription')}
          </p>
          <p>
            {tPromo('aboutDoctorDescription')}
          </p>
          
          <div className="promo-sobre-features">
            {features.map((feature, index) => (
              <div key={index} className="promo-sobre-feature">
                <div className="promo-sobre-feature-icon">
                  <FaCheck />
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