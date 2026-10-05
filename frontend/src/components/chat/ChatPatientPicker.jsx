import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import '../ChatIA.css';

const ChatPatientPicker = ({
  busqueda,
  sugerencias,
  mostrar,
  loading,
  onBuscar,
  onSelectar,
}) => {
  const { t } = useLanguage();
  return (
    <>
      <div className="chat-ia-input chat-paciente-busqueda">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBuscar(e.target.value)}
          placeholder={t('typeToSearchPatient')}
          disabled={loading}
          autoFocus
        />
      </div>
      {mostrar && sugerencias.length > 0 && (
        <div className="chat-paciente-sugerencias">
          {sugerencias.map((paciente) => (
            <button
              key={paciente.id}
              className="paciente-sugerencia-item"
              onClick={() => onSelectar(paciente)}
              type="button"
            >
              <span className="paciente-nombre">{paciente.display_text}</span>
              {paciente.foto_perfil && (
                <img
                  src={paciente.foto_perfil}
                  alt={paciente.display_text}
                  className="paciente-foto"
                />
              )}
            </button>
          ))}
        </div>
      )}
      {busqueda.length > 0 && mostrar && sugerencias.length === 0 && !loading && (
        <div className="chat-paciente-sin-resultados">
          {t('noPatientsFound')}
        </div>
      )}
    </>
  );
};

export default ChatPatientPicker;
