import { Routes, Route, Navigate } from 'react-router-dom';
import LandingWrapper from './sitioPromocional/components/LandingWrapper';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingWrapper />} />
      <Route path="/promocional" element={<LandingWrapper />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
