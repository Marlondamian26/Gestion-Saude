import React from 'react';
import { FaStethoscope, FaHeart, FaAmbulance, FaSyringe, FaFlask, FaFileMedical } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { CONFIG } from '../config/constants';
import { useInView } from '../hooks/useInView';

const iconMap = {
  stethoscope: FaStethoscope,
  heart: FaHeart,
  emergency: FaAmbulance,
  syringe: FaSyringe,
  flask: FaFlask,
  document: FaFileMedical
};

function Servicios() {
  const { tPromo } = useLanguage();
  const [ref, isInView] = useInView({ threshold: 0.1 });
  const servicios = CONFIG.services || [];
  const serviceList = tPromo('servicios');

  return (
    <section
      ref={ref}
      className={`promo-servicios ${isInView ? 'animate-in' : ''}`}
      id="servicios"
    >
      <div className={`promo-section-header ${isInView ? 'animate-fade-up' : ''}`}>
        <span className="promo-section-label">{tPromo('servicesTitle')}</span>
        <h2 className="promo-section-title">{tPromo('servicesMainTitle')}</h2>
        <p className="promo-section-subtitle">
          {tPromo('servicesSubtitle')}
        </p>
      </div>

      <div className="promo-servicios-grid">
        {servicios.map((servicio, index) => {
          const IconComponent = iconMap[servicio.icon] || FaStethoscope;
          return (
            <div
              key={servicio.id}
              className={`promo-servicio-card ${isInView ? 'animate-fade-up' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="promo-servicio-icon">
                <IconComponent />
              </div>
              <h3>{serviceList[index]?.title || servicio.nombre}</h3>
              <p>{serviceList[index]?.description || servicio.descripcion}</p>            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Servicios;