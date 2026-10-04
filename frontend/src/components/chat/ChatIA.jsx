/**
 * ChatIA.jsx — Componente orquestador delgado (~100 líneas).
 * Extraído de components/ChatIA.jsx (§4.1.2).
 * Toda la lógica de estado vive en hooks/useChatIA.js.
 *
 * Responsabilidad: render JSX, delegar handlers al hook.
 * No contiene lógica de negocio ni máquinas de estados.
 */
import React, { useEffect } from 'react';
import useChatIA from '../../hooks/useChatIA';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatSuggestions from './ChatSuggestions';
import ChatPatientPicker from './ChatPatientPicker';
import ChatInput from './ChatInput';
import '../ChatIA.css';

const ChatIA = ({ onClose }) => {
  const {
    // Estado
    estado, loading, mensaje, historial, opciones,
    busquedaPaciente, sugerenciasPacientes, mostrarSugerencias,
    chatEndRef,
    // Funciones
    inicializar, seleccionarOpcion, seleccionarPaciente,
    buscarPacientes, manejarInput, setMensaje,
    reiniciar,
  } = useChatIA(onClose);

  useEffect(() => {
    if (historial.length === 0 && opciones.length === 0) {
      inicializar(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inicializar]);

  // Determinar si se muestra el selector de paciente
  const mostrarPatientPicker = estado === 'elegir_paciente' || estado === 'elegir_paciente_accion';

  // Determinar si se muestra el input de fecha
  const mostrarInput = estado === 'esperando_fecha';

  return (
    <div className="chat-ia-container">
      <ChatHeader
        onClose={onClose}
        titulo="Asistente de Citas"
        onReset={reiniciar}
      />
      <ChatMessageList
        historial={historial}
        loading={loading}
        chatEndRef={chatEndRef}
      />

      <ChatSuggestions
        opciones={opciones}
        onSelect={seleccionarOpcion}
        disabled={loading}
      />

      {mostrarPatientPicker && (
        <ChatPatientPicker
          busqueda={busquedaPaciente}
          sugerencias={sugerenciasPacientes}
          mostrar={mostrarSugerencias}
          loading={loading}
          onBuscar={buscarPacientes}
          onSelectar={seleccionarPaciente}
        />
      )}

      {mostrarInput && (
        <ChatInput
          mensaje={mensaje}
          loading={loading}
          onSubmit={manejarInput}
          onMensajeChange={setMensaje}
        />
      )}
    </div>
  );
};

export default ChatIA;
