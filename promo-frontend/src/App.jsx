import { Routes, Route, Navigate } from 'react-router-dom';
import LandingWrapper from './sitioPromocional/components/LandingWrapper';
import Privacidad from './sitioPromocional/pages/Privacidad';
import Terminos from './sitioPromocional/pages/Terminos';
import ScrollManager from './sitioPromocional/components/ScrollManager';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingWrapper />} />
        <Route path="/promocional" element={<LandingWrapper />} />
        <Route path="/privacidad" element={<Privacidad />} />
        <Route path="/terminos" element={<Terminos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ScrollManager anchorOffset={88} />
    </>
  );
}
