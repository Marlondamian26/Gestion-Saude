import React from 'react';
import '../ChatIA.css';

const ChatPatientPicker = ({
  busqueda,
  sugerencias,
  mostrar,
  loading,
  onBuscar,
  onSelectar,
}) => {
  if (!mostrar && !busqueda) return null;
  return (
    <>
      <div className="chat-ia-input chat-paciente-busqueda">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => onBuscar(e.target.value)}
          placeholder="Escribe el nombre del paciente..."
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
      {busqueda.length > 0 && mostrar && sugerencias.length === 0 && (
        <div className="chat-paciente-sin-resultados">
          No se encontraron pacientes
        </div>
      )}
    </>
  );
};

export default ChatPatientPicker;