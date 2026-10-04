import React from 'react';
import { FaStethoscope, FaHeart, FaAmbulance, FaSyringe, FaFlask, FaFileMedical, FaCheck } from 'react-icons/fa';
import { useLanguage } from '../../context/PromoLanguageContext';
import { CONFIG } from '../config/constants';

const iconMap = {
  stethoscope: FaStethoscope,
  heart: FaHeart,
  emergency: FaAmbulance,
  syringe: FaSyringe,
  flask: FaFlask,
  document: FaFileMedical
};

function Servicios() {
  const { tPromo, language } = useLanguage();
  const servicios = CONFIG.services || [];

  const serviceList = tPromo('servicios');

  return (
    <section className="promo-servicios" id="servicios">
      <div className="promo-section-header">
        <span className="promo-section-label">{tPromo('servicesTitle')}</span>
        <h2 className="promo-section-title">{tPromo('servicesMainTitle')}</h2>
        <p className="promo-section-subtitle">
          {tPromo('servicesSubtitle')}
        </p>
      </div>
      
      <div className="promo-servicios-grid">
        {servicios.map((servicio, index) => {
          const IconComponent = iconMap[servicio.icon] || FaStethoscope;
          const translatedService = serviceList[index] || servicio;
          
          return (
            <div key={servicio.id} className="promo-servicio-card">
              <div className="promo-servicio-icon">
                <IconComponent />
              </div>
              <h3>{serviceList[index]?.title || servicio.nombre}</h3>
              <p>{serviceList[index]?.description || servicio.descripcion}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Servicios;