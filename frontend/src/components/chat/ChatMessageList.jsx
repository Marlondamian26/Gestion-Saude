import React from 'react';
import '../ChatIA.css';
import ChatMessage from './ChatMessage';

const ChatMessageList = ({ historial, loading, chatEndRef }) => (
  <div className="chat-ia-messages">
    {historial.map((msg) => (
      <ChatMessage key={msg.id} message={msg} />
    ))}
    {loading && (
      <div className="chat-message ia">
        <div className="message-content typing">
          <span className="typing-dot">.</span>
          <span className="typing-dot">.</span>
          <span className="typing-dot">.</span>
        </div>
      </div>
    )}
    <div ref={chatEndRef} />
  </div>
);

export default ChatMessageList;