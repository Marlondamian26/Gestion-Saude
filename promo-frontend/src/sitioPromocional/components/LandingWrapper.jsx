import React, { useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

import Navbar from './Navbar';
import Carousel from './Carousel';
import Hero from './Hero';
import Servicios from './Servicios';
import SobreNosotros from './SobreNosotros';
import Testimonios from './Testimonios';
import Contacto from './Contacto';
import CTA from './CTA';
import Footer from './Footer';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

function LandingWrapper() {
  const { theme } = useTheme();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="sitio-promocional" data-theme={theme}>
      <div className="promo-floating-toggles">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <a href="#main-content" className="promo-skip-link">Saltar al contenido</a>

      <Navbar />

      <main id="main-content" className="promo-main">
        <section id="inicio">
          <Carousel />
        </section>

        <Hero />

        <Servicios />
        <SobreNosotros />
        <Testimonios />
        <Contacto />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}

export default LandingWrapper;
