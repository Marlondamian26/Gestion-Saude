import React from 'react';
import '../ChatIA.css';

const ChatMessage = ({ message }) => (
  <div className={`chat-message ${message.tipo}`}>
    <div className="message-content">
      {message.texto.split('\n').map((linea, i) => (
        <p key={`${message.id}-${i}`}>{linea}</p>
      ))}
    </div>
  </div>
);

export default ChatMessage;