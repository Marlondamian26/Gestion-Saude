/**
 * ChatHeader.jsx — Título y botón de cierre del chat.
 * Subcomponente de ChatIA (§4.1.2).
 * Props: { onClose, titulo, onReset }
 */
import React from 'react';
import '../ChatIA.css';

const ChatHeader = ({ onClose, titulo, onReset }) => (
  <div className="chat-ia-header">
    <div className="chat-ia-title">
      <span className="chat-ia-icon">📅</span>
      <span>{titulo}</span>
    </div>
    {onReset && (
      <button className="chat-ia-reset" onClick={onReset} title="Reiniciar conversación">
        🔄
      </button>
    )}
    <button className="chat-ia-close" onClick={onClose}>✕</button>
  </div>
);

export default ChatHeader;
