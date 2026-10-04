// src/sitioPromocional/config/constants.js
export const CLINIC_NAME = 'Consultorio Dra. Belkis Morejón Acosta';
export const CLINIC_LOCATION = 'Benfica, Luanda, Angola';
export const CLINIC_ADDRESS = 'Benfica, Luanda';
export const CLINIC_PHONE = '+244 947 711 002';
export const CLINIC_EMAIL = 'angobelkis72@gmail.com';
export const CLINIC_WHATSAPP = '+244947711002';

export const DOCTOR_NAME = 'Dra. Belkis Morejón Acosta';
export const DOCTOR_TITLE = 'Médica Especialista';
export const DOCTOR_SPECIALTY = 'Medicina General';

// URLs externas — la promo se despliega como sitio independiente
const PLATFORM_BASE = import.meta.env.VITE_PLATFORM_URL || 'https://gestion-saude-platform.onrender.com';
export const PLATFORM_URL = `${PLATFORM_BASE}/login`;
export const REGISTRO_URL = `${PLATFORM_BASE}/registro`;

export const CONFIG = {
  hero: {
    badge: 'Atención Médica de Calidad',
    title: 'Cuidamos de tu salud con profesionalismo y dedicación',
    subtitle: 'En nuestro consultorio encontrarás una atención médica integral, personalizada y humana. Tu bienestar y el de tu familia son nuestra máxima prioridad.'
  },
  services: [
    {
      id: 1,
      title: 'Consulta Médica General',
      description: 'Atención integral para todas las edades. Diagnóstico, tratamiento y seguimiento de enfermedades comunes.',
      icon: 'stethoscope'
    },
    {
      id: 2,
      title: 'Cardiología',
      description: 'Evaluación y tratamiento de enfermedades del corazón y sistema cardiovascular.',
      icon: 'heart'
    },
    {
      id: 3,
      title: 'Atención de Emergencias',
      description: 'Servicio de urgencias médicas disponible para casos que requieren atención inmediata.',
      icon: 'emergency'
    },
    {
      id: 4,
      title: 'Vacunación',
      description: 'Programa de vacunación para adultos y niños. Todas las vacunas del esquema nacional.',
      icon: 'syringe'
    },
    {
      id: 5,
      title: 'Análisis Clínicos',
      description: 'Servicio de laboratorio para exámenes de sangre, orina y otros análisis diagnósticos.',
      icon: 'flask'
    },
    {
      id: 6,
      title: 'Certificados Médicos',
      description: 'Emitimos certificados médicos para trabajo, escuela, trámites administrativos y más.',
      icon: 'document'
    }
  ],
  about: {
    title: 'Comprometidos con tu Salud y Bienestar',
    description: 'Desde nuestra fundación, nos hemos dedicado a proporcionar atención médica de excelencia a la comunidad de Benfica, Luanda. Nuestra misión es proporcionar atención médica integral, humana y personalizada a cada paciente.',
    doctorDescription: 'La Dra. Belkis Morejón Acosta lidera nuestro equipo con una visión clara: ofrecer atención médica accesible, de calidad y centrada en el paciente. Nuestro equipo está comprometido con tu bienestar integral.',
    stats: {
      years: '5',
      patients: '2000',
      satisfaction: '98%',
      emergency: '24/7'
    }
  },
  testimonials: [
    {
      id: 1,
      name: 'María García',
      text: 'Excelente atención. La Dra. Belkis es muy profesional y dedicada. Siempre me siento bien atendida en cada consulta.'
    },
    {
      id: 2,
      name: 'João Pedro',
      text: 'Muy buen servicio. El consultorio está bien equipado y el personal es muy amable. Recomendado.'
    },
    {
      id: 3,
      name: 'Ana Cristina',
      text: 'La Dra. Morejón es una excelente médica. Me ha ayudado mucho con mi tratamiento. Gracias por su dedicación.'
    }
  ],
  contact: {
    title: 'Contáctenos',
    subtitle: 'Estamos listos para atenderte. Puedes visitarnos, llamarnos o escribirnos.',
    address: 'Benfica, Luanda, Angola',
    phone: '+244 947 711 002',
    email: 'angobelkis72@gmail.com',
    hours: 'Lunes a Viernes: 8:00 - 18:00'
  },
  cta: {
    title: '¿Listo para cuidar tu salud?',
    subtitle: 'Regístrate en nuestra plataforma para gestionar tus citas y acceder a tu historial médico.',
    loginText: 'Iniciar Sesión',
    registerText: 'Registrarse'
  },
  footer: {
    description: 'Consultorio médico de la Dra. Belkis Morejón Acosta. Comprometidos con tu salud y bienestar en Benfica, Luanda.',
    quickLinks: [
      { text: 'Inicio', url: '#inicio' },
      { text: 'Servicios', url: '#servicios' },
      { text: 'Sobre Nosotros', url: '#sobre-nosotros' },
      { text: 'Contacto', url: '#contacto' }
    ],
    services: [
      'Consulta Médica',
      'Cardiología',
      'Emergencias',
      'Vacunación',
      'Análisis Clínicos'
    ],
    copyright: `© ${new Date().getFullYear()} ${CLINIC_NAME}. Todos los derechos reservados.`
  }
};