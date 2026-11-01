import React from 'react';
import LegalPage from '../components/LegalPage';

const sections = [
  {
    title: 'terminosS1Title',
    body: ['terminosS1Body'],
  },
  {
    title: 'terminosS2Title',
    body: ['terminosS2Body'],
  },
  {
    title: 'terminosS3Title',
    body: ['terminosS3Body'],
  },
  {
    title: 'terminosS4Title',
    body: ['terminosS4Body'],
  },
  {
    title: 'terminosS5Title',
    body: ['terminosS5Body'],
  },
  {
    title: 'terminosS6Title',
    body: ['terminosS6Body'],
  },
  {
    title: 'terminosS7Title',
    body: ['terminosS7Body'],
  },
  {
    title: 'terminosS8Title',
    body: ['terminosS8Body'],
  },
  {
    title: 'terminosS9Title',
    body: ['terminosS9Body'],
  },
  {
    title: 'terminosS10Title',
    body: ['terminosS10Body'],
  },
];

export default function Terminos() {
  return (
    <LegalPage
      titleKey="terminosTitle"
      warningKey="legalWarning"
      sections={sections}
    />
  );
}
