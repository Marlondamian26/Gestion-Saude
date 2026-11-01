import React from 'react';
import LegalPage from '../components/LegalPage';

const sections = [
  {
    title: 'privacidadS1Title',
    body: ['privacidadS1Body'],
  },
  {
    title: 'privacidadS2Title',
    body: ['privacidadS2Body'],
  },
  {
    title: 'privacidadS3Title',
    body: ['privacidadS3Body'],
  },
  {
    title: 'privacidadS4Title',
    body: ['privacidadS4Body'],
  },
  {
    title: 'privacidadS5Title',
    body: ['privacidadS5Body'],
  },
  {
    title: 'privacidadS6Title',
    body: ['privacidadS6Body'],
  },
  {
    title: 'privacidadS7Title',
    body: ['privacidadS7Body'],
  },
  {
    title: 'privacidadS8Title',
    body: ['privacidadS8Body'],
  },
  {
    title: 'privacidadS9Title',
    body: ['privacidadS9Body'],
  },
  {
    title: 'privacidadS10Title',
    body: ['privacidadS10Body'],
  },
];

export default function Privacidad() {
  return (
    <LegalPage
      titleKey="privacidadTitle"
      warningKey="legalWarning"
      sections={sections}
    />
  );
}
