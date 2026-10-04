import React from 'react';
import '../ChatIA.css';

const ChatSuggestions = ({ opciones, onSelect, disabled, loading }) => {
  if (!opciones || opciones.length === 0) return null;
  return (
    <div className="chat-sugerencias">
      {opciones.map((opcion) => (
        <button
          key={opcion.id}
          className="sugerencia-chip"
          onClick={() => onSelect(opcion.id)}
          disabled={disabled || loading}
        >
          {opcion.texto}
        </button>
      ))}
    </div>
  );
};

export default ChatSuggestions;