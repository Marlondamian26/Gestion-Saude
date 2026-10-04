import React from 'react';
import '../ChatIA.css';

const ChatInput = ({ mensaje, loading, onSubmit, onMensajeChange }) => {
  return (
    <form className="chat-ia-input" onSubmit={onSubmit}>
      <input
        type="text"
        value={mensaje}
        onChange={(e) => onMensajeChange(e.target.value)}
        placeholder="Ingresa fecha (YYYY-MM-DD)"
        disabled={loading}
      />
      <button type="submit" disabled={loading || !mensaje.trim()}>
        ➤
      </button>
    </form>
  );
};

export default ChatInput;