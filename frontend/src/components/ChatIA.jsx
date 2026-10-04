/* eslint-disable react-refresh/only-export-components */
/**
 * ChatIA.jsx — Re-export del component refactorizado.
 *
 * El componente original (1326 líneas) fue dividido en:
 * - hooks/useChatIA.js             — máquina de estados + lógica de negocio
 * - services/chatService.js        — llamadas API
 * - components/chat/ChatIA.jsx     — orquestador delgado (~100 líneas)
 * - components/chat/ChatHeader.jsx
 * - components/chat/ChatMessageList.jsx
 * - components/chat/ChatMessage.jsx
 * - components/chat/ChatSuggestions.jsx
 * - components/chat/ChatPatientPicker.jsx
 * - components/chat/ChatInput.jsx
 *
 * TODO(FASE 6): Eliminar este archivo y actualizar imports a usar ./chat/ChatIA directamente.
 * Ver AUDIT.md §4.1.2 para detalles.
 *
 * §4.1.2 — Refactor de ChatIA.jsx (1326 líneas → 11 archivos, max ~100 líneas por componente)
 */
export { default } from './chat/ChatIA';
export { default as ChatHeader } from './chat/ChatHeader';
export { default as ChatMessageList } from './chat/ChatMessageList';
export { default as ChatMessage } from './chat/ChatMessage';
export { default as ChatSuggestions } from './chat/ChatSuggestions';
export { default as ChatPatientPicker } from './chat/ChatPatientPicker';
export { default as ChatInput } from './chat/ChatInput';
