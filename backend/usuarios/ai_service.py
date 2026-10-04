"""
Servico de IA Basico para Assistente de Agendamento de Consultas
Este modulo contem a logica do chat interativo sem necessidade de APIs externas.
"""

from django.db import transaction
from django.core.cache import cache
import re
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from django.utils import timezone
from django.db.models import Q

# Logger para el servicio de IA
logger = logging.getLogger(__name__)

from .models import (
    Usuario, Doctor, Enfermera, Paciente, 
    Especialidad, Horario, Cita
)

# [FASE 5 §5.5] Instrumentación de métricas (logging estructurado, no cambia lógica)
try:
    from .chat_metrics import log_event, log_session_started, log_intent_detected, \
        log_intent_unrecognized, log_cita_creada, log_abandoned, log_error
except Exception:
    # Fallback si chat_metrics no está disponible
    def log_event(*a, **kw): pass
    def log_session_started(*a, **kw): pass
    def log_intent_detected(*a, **kw): pass
    def log_intent_unrecognized(*a, **kw): pass
    def log_cita_creada(*a, **kw): pass
    def log_abandoned(*a, **kw): pass
    def log_error(*a, **kw): pass


class EstadoConversacion:
    """Estados do fluxo de conversacao"""
    INICIO = "inicio"
    ESPECIALIDAD = "especialidad"
    DATA = "data"
    HORA = "hora"
    MEDICO = "medico"
    CONFIRMAR = "confirmar"
    CANCELAR = "cancelar"
    VER_HORARIOS = "ver_horarios"


class ServicioIA:
    """
    Assistente de IA basico para agendamento de consultas.
    Utiliza regras predefinidas e reconhecimento de padroes.
    """
    
    # Palabras clave por intención
    PALABRAS_CITA = [
        'consulta', 'agendar', 'reservar', 'turno', 'appointment',
        'quero', 'preciso', 'programar', 'marcar'
    ]
    
    PALABRAS_CANCELAR = [
        'cancelar', 'cancelacao', 'eliminar', 'apagar'
    ]
    
    PALABRAS_HORARIOS = [
        'horario', 'horarios', 'disponivel', 'disponibilidade', 'quando'
    ]
    
    PALABRAS_CONFIRMAR = [
        'sim', 'confirmar', 'ok', 'perfeito', 'de acordo', 'correto'
    ]
    
    PALABRAS_NEGAR = [
        'nao', 'negativo', 'cancelar', 'outro', 'mudar'
    ]
    
    PALABRAS_ESPECIALIDADES = [
        'cardiología', 'cardiologia', 'cardio',
        'dermatología', 'dermatologia', 'dermato',
        'pediatría', 'pediatria', 'pedia',
        'ginecología', 'ginecologia', 'gine',
        'neurología', 'neurologia', 'neuro',
        'oftalmología', 'oftalmologia', 'oftalmo',
        'ortopedia', 'ortopedia', 'orto',
        'psicología', 'psicologia', 'psico',
        'medicina general', 'medico general',
        'cirugía', 'cirugia', 'cirujano',
        'urología', 'urologia', 'uro',
        'endocrinología', 'endocrinologia', 'endo',
        'gastroenterología', 'gastroenterologia', 'gastro',
    ]
    
    # Respuestas predefinidas
    RESPUESTAS_SALUDO = [
        "¡Hola! 👋 Soy el asistente de Belkis Saúde. ¿En qué puedo ayudarte hoy?",
        "¡Bienvenido! 🎉 ¿Te gustaría agendar una cita médica?",
        "¡Hola! 😊 Puedo ayudarte a programar tu próxima cita. ¿Qué necesitas?"
    ]
    
    RESPUESTAS_AYUDA = [
        "Puedo ayudarte con:\n📅 - Agendar una cita médica\n🗓️ - Ver horarios disponibles\n❌ - Cancelar una cita\n¿Qué prefieres?"
    ]
    
    def __init__(self):
        self.estado_actual = EstadoConversacion.INICIO
        self.datos_cita = {
            'especialidad': None,
            'doctor': None,
            'fecha': None,
            'hora': None,
            'paciente': None
        }
        self.sesion_restaurada = False  # Flag para indicar si la sesión fue restaurada desde backup
    
    def inicializar(self, paciente: Paciente) -> 'ServicioIA':
        """Inicializa el servicio para un paciente específico"""
        self.datos_cita['paciente'] = paciente
        self.estado_actual = EstadoConversacion.INICIO
        return self
    
    def procesar_mensaje(self, mensaje: str) -> Tuple[str, str]:
        """
        Procesa el mensaje del paciente y retorna la respuesta.
        Retorna: (respuesta, nuevo_estado)
        """
        mensaje = mensaje.lower().strip()
        
        # Verificar intención principal
        if self._es_cancelar(mensaje):
            return self._procesar_cancelar(mensaje)
        
        # Máquina de estados según el estado actual
        if self.estado_actual == EstadoConversacion.INICIO:
            return self._procesar_inicio(mensaje)
        
        elif self.estado_actual == EstadoConversacion.ESPECIALIDAD:
            return self._procesar_especialidad(mensaje)
        
        elif self.estado_actual == EstadoConversacion.FECHA:
            return self._procesar_fecha(mensaje)
        
        elif self.estado_actual == EstadoConversacion.HORA:
            return self._procesar_hora(mensaje)
        
        elif self.estado_actual == EstadoConversacion.DOCTOR:
            return self._procesar_doctor(mensaje)
        
        elif self.estado_actual == EstadoConversacion.CONFIRMAR:
            return self._procesar_confirmar(mensaje)
        
        elif self.estado_actual == EstadoConversacion.VER_HORARIOS:
            return self._procesar_horarios(mensaje)
        
        return "Algo salió mal. ¿Podrías empezar de nuevo?", EstadoConversacion.INICIO
    
    def _es_cita(self, texto: str) -> bool:
        return any(palabra in texto for palabra in self.PALABRAS_CITA)
    
    def _es_cancelar(self, texto: str) -> bool:
        return any(palabra in texto for palabra in self.PALABRAS_CANCELAR)
    
    def _es_horarios(self, texto: str) -> bool:
        return any(palabra in texto for palabra in self.PALABRAS_HORARIOS)
    
    def _es_confirmar(self, texto: str) -> bool:
        return any(palabra in texto for palabra in self.PALABRAS_CONFIRMAR)
    
    def _es_negar(self, texto: str) -> bool:
        return any(palabra in texto for palabra in self.PALABRAS_NEGAR)
    
    def _procesar_inicio(self, mensaje: str) -> Tuple[str, str]:
        """Procesa el estado inicial"""
        if self._es_cita(mensaje):
            return self._pedir_especialidad()
        
        elif self._es_horarios(mensaje):
            return self._pedir_especialidad_horarios()
        
        elif self._es_cancelar(mensaje):
            return self._pedir_cancelar()
        
        # Mensaje no reconocido
        import random
        return random.choice(self.RESPUESTAS_AYUDA), EstadoConversacion.INICIO
    
    def _pedir_especialidad(self) -> Tuple[str, str]:
        """Pide al paciente que seleccione una especialidad"""
        especialidades = Especialidad.objects.filter(activo=True)
        
        opciones = "\n".join([
            f"{i+1}. {esp.nombre}" 
            for i, esp in enumerate(especialidades[:10])
        ])
        
        respuesta = (
            f"¡Perfecto! 😊\n\n"
            f"¿Qué especialidad necesitas?\n\n"
            f"{opciones}\n\n"
            f"Responde con el número o el nombre de la especialidad."
        )
        return respuesta, EstadoConversacion.ESPECIALIDAD
    
    def _pedir_especialidad_horarios(self) -> Tuple[str, str]:
        """Pide especialidad para ver horarios"""
        especialidades = Especialidad.objects.filter(activo=True)
        
        opciones = "\n".join([
            f"{i+1}. {esp.nombre}" 
            for i, esp in enumerate(especialidades[:10])
        ])
        
        respuesta = (
            f"📅 ¿De qué especialidad quieres ver horarios?\n\n"
            f"{opciones}\n\n"
            f"Responde con el número o el nombre."
        )
        return respuesta, EstadoConversacion.VER_HORARIOS
    
    def _pedir_cancelar(self) -> Tuple[str, str]:
        """Pide información para cancelar"""
        # Obtener citas del paciente
        citas = Cita.objects.filter(
            paciente__usuario=self.datos_cita['paciente'].usuario,
            estado__in=['pendiente', 'confirmada']
        )
        
        if not citas:
            return "No tienes citas programadas para cancelar. 😊", EstadoConversacion.INICIO
        
        opciones = "\n".join([
            f"{i+1}. {c.fecha.strftime('%d/%m/%Y')} a las {c.hora.strftime('%H:%M')} con Dr. {c.doctor.usuario.first_name}"
            for i, c in enumerate(citas[:5])
        ])
        
        respuesta = (
            f"❌ Selecciona la cita que deseas cancelar:\n\n"
            f"{opciones}\n\n"
            f"Responde con el número."
        )
        return respuesta, EstadoConversacion.CANCELAR
    
    def _procesar_especialidad(self, mensaje: str) -> Tuple[str, str]:
        """Procesa la especialidad seleccionada"""
        # Intentar extraer número o nombre
        especialidad = self._extraer_especialidad(mensaje)
        
        if not especialidad:
            return (
                "No entendí la especialidad. 😅\n"
                "Por favor, responde con el nombre o número de la especialidad."
            ), EstadoConversacion.ESPECIALIDAD
        
        self.datos_cita['especialidad'] = especialidad
        return self._pedir_fecha()
    
    def _extraer_especialidad(self, texto: str) -> Optional[Especialidad]:
        """Extrae la especialidad del texto"""
        # Buscar por número
        try:
            num = int(texto.strip()) - 1
            especialidades = list(Especialidad.objects.filter(activo=True)[:10])
            if 0 <= num < len(especialidades):
                return especialidades[num]
        except ValueError:
            pass
        
        # Buscar por nombre
        texto_lower = texto.lower()
        for esp in Especialidad.objects.filter(activo=True):
            if esp.nombre.lower() in texto_lower:
                return esp
        
        return None
    
    def _pedir_fecha(self) -> Tuple[str, str]:
        """Pide la fecha de la cita"""
        esp = self.datos_cita['especialidad']
        
        respuesta = (
            f"✅ Especialidad seleccionada: **{esp.nombre}**\n\n"
            f"📅 ¿Qué fecha te conviene?\n\n"
            f"Puedes decir:\n"
            f"- 'hoy'\n"
            f"- 'mañana'\n"
            f"- 'lunes', 'martes', etc.\n"
            f"- o una fecha específica como '15 de enero'"
        )
        return respuesta, EstadoConversacion.FECHA
    
    def _procesar_fecha(self, mensaje: str) -> Tuple[str, str]:
        """Procesa la fecha ingresada"""
        fecha = self._extraer_fecha(mensaje)
        
        if not fecha:
            return (
                "No entendí la fecha. 😅\n"
                "Por favor, intenta con 'hoy', 'mañana', o '15/01/2024'"
            ), EstadoConversacion.FECHA
        
        # Verificar que no sea fecha pasada
        from django.utils import timezone
        if fecha < timezone.now().date():
            return (
                "❌ No podemos agendar en fechas pasadas. 😅\n"
                "Por favor, selecciona una fecha futura."
            ), EstadoConversacion.FECHA
        
        self.datos_cita['fecha'] = fecha
        return self._pedir_hora()
    
    def _extraer_fecha(self, texto: str):
        """Extrae la fecha del texto"""
        texto = texto.lower().strip()
        hoy = datetime.now().date()
        
        # Fechas relativas
        if 'hoy' in texto:
            return hoy
        if 'mañana' in texto or 'manana' in texto:
            return hoy + timedelta(days=1)
        
        # Días de la semana
        dias = {
            'lunes': 0, 'martes': 1, 'miércoles': 2, 'miercoles': 2,
            'jueves': 3, 'viernes': 4, 'sábado': 5, 'sabado': 5, 'domingo': 6
        }
        
        for dia_nombre, dia_num in dias.items():
            if dia_nombre in texto:
                dias_hasta = (dia_num - hoy.weekday()) % 7
                if dias_hasta == 0:
                    dias_hasta = 7
                return hoy + timedelta(days=dias_hasta)
        
        # Intentar fecha específica (DD/MM/YYYY o similar)
        patrones = [
            r'(\d{1,2})/(\d{1,2})/(\d{4})',
            r'(\d{1,2})[-.](\d{1,2})[-.](\d{4})',
            r'(\d{1,2}) de (\w+) de (\d{4})',
        ]
        
        for patron in patrones:
            match = re.search(patron, texto)
            if match:
                try:
                    if len(match.groups()) == 3:
                        if len(match.group(3)) == 4:  # YYYY
                            dia, mes, anio = int(match.group(1)), int(match.group(2)), int(match.group(3))
                            return datetime(anio, mes, dia).date()
                except:
                    pass
        
        return None
    
    def _pedir_hora(self) -> Tuple[str, str]:
        """Pide la hora de la cita"""
        fecha = self.datos_cita['fecha']
        esp = self.datos_cita['especialidad']
        
        # Obtener doctores disponibles en esa fecha
        disponibilidad = self._obtener_disponibilidad(fecha, esp)
        
        if not disponibilidad['doctores']:
            return (
                f"😔 Lo siento, no hay doctores disponibles de {esp.nombre} "
                f"para el {fecha.strftime('%d/%m/%Y')}.\n"
                f"¿Te gustaría intentar otra fecha?"
            ), EstadoConversacion.FECHA
        
        # Mostrar opciones de doctores
        doctores_info = "\n".join([
            f"{i+1}. Dr. {d['nombre']} - {d['especialidad']}"
            for i, d in enumerate(disponibilidad['doctores'][:5])
        ])
        
        respuesta = (
            f"📅 Fecha: **{fecha.strftime('%d/%m/%Y')}**\n\n"
            f"👨‍⚕️ Doctores disponibles:\n{doctores_info}\n\n"
            f"¿Con cuál doctor quieres la cita? (responde con el número)"
        )
        return respuesta, EstadoConversacion.DOCTOR
    
    def _obtener_disponibilidad(self, fecha, especialidad) -> Dict:
        """Obtiene doctores disponibles para una fecha y especialidad"""
        dia_semana = fecha.weekday()
        
        # Obtener horarios para ese día
        horarios = Horario.objects.filter(
            doctor__especialidad=especialidad,
            dia_semana=dia_semana,
            activo=True
        ).select_related('doctor__usuario')
        
        doctores = []
        horas_disponibles = {}
        
        for horario in horarios:
            doctor = horario.doctor
            doctor_id = doctor.id
            
            if doctor_id not in [d['id'] for d in doctores]:
                doctores.append({
                    'id': doctor.id,
                    'nombre': f"{doctor.usuario.first_name} {doctor.usuario.last_name}",
                    'especialidad': doctor.especialidad.nombre if doctor.especialidad else doctor.otra_especialidad
                })
            
            # Obtener horas ocupadas
            horas_ocupadas = Cita.objects.filter(
                doctor=doctor,
                fecha=fecha,
                estado__in=['pendiente', 'confirmada']
            ).values_list('hora', flat=True)
            
            # Generar horas disponibles
            horas = []
            hora_actual = horario.hora_inicio
            while hora_actual < horario.hora_fin:
                hora_time = hora_actual
                if hora_time not in horas_ocupadas:
                    horas.append(hora_actual.strftime('%H:%M'))
                # Incrementar 1 hora
                hora_actual = (datetime.combine(fecha, hora_actual) + timedelta(hours=1)).time()
        
        return {
            'doctores': doctores,
            'horas': horas_disponibles,
            'fecha': fecha
        }
    
    def _procesar_doctor(self, mensaje: str) -> Tuple[str, str]:
        """Procesa el doctor seleccionado"""
        doctor = self._extraer_doctor(mensaje)
        
        if not doctor:
            return (
                "No entendí el doctor. 😅\n"
                "Por favor, responde con el número del doctor."
            ), EstadoConversacion.DOCTOR
        
        self.datos_cita['doctor'] = doctor
        return self._mostrar_horarios_disponibles()
    
    def _extraer_doctor(self, texto: str) -> Optional[Doctor]:
        """Extrae el doctor del texto"""
        try:
            num = int(texto.strip()) - 1
            fecha = self.datos_cita['fecha']
            esp = self.datos_cita['especialidad']
            
            disponibilidad = self._obtener_disponibilidad(fecha, esp)
            
            if 0 <= num < len(disponibilidad['doctores']):
                doctor_id = disponibilidad['doctores'][num]['id']
                return Doctor.objects.get(id=doctor_id)
        except ValueError:
            pass
        
        return None
    
    def _mostrar_horarios_disponibles(self) -> Tuple[str, str]:
        """Muestra los horarios disponibles para el doctor seleccionado"""
        doctor = self.datos_cita['doctor']
        fecha = self.datos_cita['fecha']
        
        # Obtener horas ocupadas
        horas_ocupadas = Cita.objects.filter(
            doctor=doctor,
            fecha=fecha,
            estado__in=['pendiente', 'confirmada']
        ).values_list('hora', flat=True)
        
        # Obtener horario del doctor en ese día
        horarios = Horario.objects.filter(
            doctor=doctor,
            dia_semana=fecha.weekday(),
            activo=True
        )
        
        if not horarios:
            return (
                f"😔 El Dr. {doctor.usuario.first_name} no tiene horarios "
                f"disponibles para ese día.\n"
                f"¿Te gustaría elegir otro doctor?"
            ), EstadoConversacion.DOCTOR
        
        # Generar horas disponibles
        horas = []
        for horario in horarios:
            from datetime import time, datetime, timedelta
            hora_actual = horario.hora_inicio
            while hora_actual < horario.hora_fin:
                hora_time = hora_actual
                if hora_time not in horas_ocupadas:
                    horas.append(hora_actual.strftime('%H:%M'))
                # Incrementar 30 minutos
                hora_actual = (datetime.combine(fecha, hora_actual) + timedelta(minutes=30)).time()
        
        if not horas:
            return (
                f"😔 No hay horarios disponibles con el Dr. {doctor.usuario.first_name} "
                f"para el {fecha.strftime('%d/%m/%Y')}.\n"
                f"¿Te gustaría elegir otra fecha o doctor?"
            ), EstadoConversacion.FECHA
        
        # Limitar a 8 opciones
        horas = horas[:8]
        
        opciones = "\n".join([f"{i+1}. {h}" for i, h in enumerate(horas)])
        
        respuesta = (
            f"👨‍⚕️ Doctor: **Dr. {doctor.usuario.first_name} {doctor.usuario.last_name}**\n"
            f"📅 Fecha: **{fecha.strftime('%d/%m/%Y')}**\n\n"
            f"⏰ Horarios disponibles:\n{opciones}\n\n"
            f"¿Qué hora te conviene? (responde con el número)"
        )
        return respuesta, EstadoConversacion.HORA
    
    def _procesar_hora(self, mensaje: str) -> Tuple[str, str]:
        """Procesa la hora seleccionada"""
        hora = self._extraer_hora(mensaje)
        
        if not hora:
            return (
                "No entendí la hora. 😅\n"
                "Por favor, responde con el número del horario."
            ), EstadoConversacion.HORA
        
        self.datos_cita['hora'] = hora
        return self._confirmar_cita()
    
    def _extraer_hora(self, texto: str) -> Optional[str]:
        """Extrae la hora del texto"""
        from datetime import time as time_cls, datetime, timedelta
        try:
            num = int(texto.strip()) - 1
            
            doctor = self.datos_cita['doctor']
            fecha = self.datos_cita['fecha']
            
            # Obtener horas ocupadas
            horas_ocupadas = Cita.objects.filter(
                doctor=doctor,
                fecha=fecha,
                estado__in=['pendiente', 'confirmada']
            ).values_list('hora', flat=True)
            
            # Convertir a set para comparación eficiente
            horas_ocupadas_set = set(horas_ocupadas)
            
            # Obtener horarios del doctor
            horarios = Horario.objects.filter(
                doctor=doctor,
                dia_semana=fecha.weekday(),
                activo=True
            )
            
            horas = []
            for horario in horarios:
                hora_actual = horario.hora_inicio
                while hora_actual < horario.hora_fin:
                    # Verificar si la hora no está ocupada
                    if hora_actual not in horas_ocupadas_set:
                        horas.append(hora_actual.strftime('%H:%M'))
                    # Incrementar 30 minutos usando datetime para evitar problemas de tipo
                    hora_actual = (datetime.combine(fecha, hora_actual) + timedelta(minutes=30)).time()
            
            if 0 <= num < len(horas):
                return horas[num]
        except ValueError:
            pass
        
        return None
    
    def _confirmar_cita(self) -> Tuple[str, str]:
        """Confirma los datos de la cita"""
        doctor = self.datos_cita['doctor']
        fecha = self.datos_cita['fecha']
        hora = self.datos_cita['hora']
        esp = self.datos_cita['especialidad']
        
        respuesta = (
            f"📋 **Resumen de tu cita:**\n\n"
            f"👨‍⚕️ Doctor: Dr. {doctor.usuario.first_name} {doctor.usuario.last_name}\n"
            f"📌 Specialty: {esp.nombre}\n"
            f"📅 Fecha: {fecha.strftime('%d/%m/%Y')}\n"
            f"⏰ Hora: {hora}\n\n"
            f"¿Confirmas esta cita?\n\n"
            f"✅ Responde 'sí' o 'confirmar'\n"
            f"❌ Responde 'no' o 'cambiar' para modificar"
        )
        return respuesta, EstadoConversacion.CONFIRMAR
    
    def _procesar_confirmar(self, mensaje: str) -> Tuple[str, str]:
        """Procesa la confirmación de la cita"""
        if self._es_confirmar(mensaje):
            return self._crear_cita()
        elif self._es_negar(mensaje):
            return (
                "¡Entendido! 😊 ¿Qué te gustaría cambiar?\n"
                "1. Otra fecha\n"
                "2. Otro doctor\n"
                "3. Otra especialidad\n"
                "Responde con el número."
            ), EstadoConversacion.INICIO
        else:
            return (
                "Por favor, responde 'sí' para confirmar o 'no' para cancelar."
            ), EstadoConversacion.CONFIRMAR
    
    def _crear_cita(self) -> Tuple[str, str]:
        """Crea la cita en la base de datos con soporte para transacciones"""
        from django.db import transaction
        from django.core.cache import cache
        import time
        
        try:
            with transaction.atomic():
                paciente = self.datos_cita['paciente']
                doctor = self.datos_cita['doctor']
                fecha = self.datos_cita['fecha']
                
                # Parsear hora con validación
                hora_parts = self.datos_cita['hora'].split(':')
                if len(hora_parts) != 2:
                    return (
                        "Formato de hora inválido. 😅\n"
                        "Por favor, intenta de nuevo."
                    ), EstadoConversacion.HORA
                
                try:
                    hora = time(int(hora_parts[0]), int(hora_parts[1]))
                except (ValueError, IndexError):
                    return (
                        "Formato de hora inválido. 😅\n"
                        "Por favor, intenta de nuevo."
                    ), EstadoConversacion.HORA
                
                # Crear la cita dentro de una transacción atómica
                with transaction.atomic():
                    # Verificar que el horario aún esté disponible (prevención de race condition)
                    cita_existente = Cita.objects.filter(
                        doctor=doctor,
                        fecha=fecha,
                        hora=hora,
                        estado__in=['pendiente', 'confirmada']
                    ).exists()
                    
                    if cita_existente:
                        return (
                            "😔 Lo siento, ese horario ya no está disponible. 😅\n"
                            "Por favor, selecciona otro horario."
                        ), EstadoConversacion.HORA
                    
                    # Crear la cita
                    cita = Cita.objects.create(
                        paciente=paciente,
                        doctor=doctor,
                        fecha=fecha,
                        hora=hora,
                        estado='pendiente'
                    )
                    
                    # Notificar (si el servicio está disponible) - dentro de la transacción
                    try:
                        from notificaciones.services import ServicioNotificaciones
                        ServicioNotificaciones.notificar_cita_creada(cita)
                    except:
                        pass  # Si falla la notificación, no importa (la cita ya está creada)
            
            # Limpiar datos de cita para nueva conversación
            self.datos_cita = {
                'paciente': paciente,
                'especialidad': None,
                'doctor': None,
                'fecha': None,
                'hora': None
            }
            
            # [FASE 5 §5.5] Loggear cita creada
            try:
                cita_id = cita_nueva.id if cita_nueva else None
                log_cita_creada(self.paciente.usuario, cita_id)
            except Exception:
                pass

            return (
                f"🎉 **¡Cita confirmada!**\n\n"
                f"Tu cita ha sido creada exitosamente.\n\n"
                f"📋 **Detalles:**\n"
                f"Doctor: Dr. {doctor.usuario.first_name} {doctor.usuario.last_name}\n"
                f"Fecha: {fecha.strftime('%d/%m/%Y')}\n"
                f"Hora: {hora.strftime('%H:%M')}\n\n"
                f"Recibirás una notificación cuando sea confirmada. ✅\n\n"
                f"¿Hay algo más en lo que pueda ayudarte?"
            ), EstadoConversacion.INICIO
            
        except Exception as e:
            # Log del error interno (no exponer al usuario)
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error al crear cita para paciente {self.datos_cita.get('paciente')}: {str(e)}")
            
            return (
                "😔 Hubo un error al crear la cita. 😕\n"
                "Por favor, intenta de nuevo o contacta al administrador."
            ), EstadoConversacion.INICIO
    
    def _procesar_cancelar(self, mensaje: str) -> Tuple[str, str]:
        """Procesa la cancelación de una cita"""
        try:
            num = int(mensaje.strip()) - 1
            citas = Cita.objects.filter(
                paciente__usuario=self.datos_cita['paciente'].usuario,
                estado__in=['pendiente', 'confirmada']
            )[:5]
            
            if 0 <= num < len(citas):
                cita = list(citas)[num]
                cita.estado = 'cancelada'
                cita.save()
                
                return (
                    f"❌ **Cita cancelada**\n\n"
                    f"La cita del {cita.fecha.strftime('%d/%m/%Y')} a las "
                    f"{cita.hora.strftime('%H:%M')} ha sido cancelada.\n\n"
                    f"¿Te gustaría agendar una nueva cita?"
                ), EstadoConversacion.INICIO
        except ValueError:
            pass
        
        return (
            "No entendí tu selección. ¿Podrías responder con el número de la cita?"
        ), EstadoConversacion.CANCELAR
    
    def _procesar_horarios(self, mensaje: str) -> Tuple[str, str]:
        """Procesa la consulta de horarios"""
        especialidad = self._extraer_especialidad(mensaje)
        
        if not especialidad:
            return (
                "No entendí la especialidad. 😅\n"
                "Por favor, responde con el nombre o número."
            ), EstadoConversacion.VER_HORARIOS
        
        # Mostrar doctores y sus horarios
        doctores = Doctor.objects.filter(
            especialidad=especialidad
        ).select_related('usuario')
        
        if not doctores:
            return (
                f"😔 No hay doctores de {especialidad.nombre} disponibles actualmente.\n"
                f"¿Te gustaría ver otras especialidades?"
            ), EstadoConversacion.INICIO
        
        respuesta = f"👨‍⚕️ **Doctores de {especialidad.nombre}:**\n\n"
        
        for doctor in doctores[:5]:
            horarios = Horario.objects.filter(doctor=doctor, activo=True)
            dias = []
            for h in horarios:
                dias.append(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'][h.dia_semana])
            
            dias_unicos = ', '.join(set(dias)) if dias else 'Sin horarios'
            respuesta += f"Dr. {doctor.usuario.first_name} {doctor.usuario.last_name}\n"
            respuesta += f"   📅 Días: {dias_unicos}\n\n"
        
        respuesta += "¿Te gustaría agendar una cita con alguno de ellos?"
        
        return respuesta, EstadoConversacion.INICIO
    
    def obtener_sugerencias(self) -> List[str]:
        """Retorna sugerencias según el estado actual"""
        if self.estado_actual == EstadoConversacion.INICIO:
            return [
                "Quiero agendar una cita",
                "Ver horarios disponibles",
                "Tengo una consulta"
            ]
        return []
    
    def get_estado_serializable(self) -> dict:
        """Retorna un diccionario serializable con el estado"""
        return {
            'estado_actual': self.estado_actual,
            'datos_cita': self.datos_cita,
        }
    
    @classmethod
    def desde_estado(cls, paciente: Paciente, estado_dict: dict) -> 'ServicioIA':
        """Crea una instancia de ServicioIA desde un estado serializable"""
        instancia = cls()
        instancia.estado_actual = estado_dict.get('estado_actual', EstadoConversacion.INICIO)
        instancia.datos_cita = estado_dict.get('datos_cita', {'paciente': paciente})
        instancia.datos_cita['paciente'] = paciente  # Siempre actualizar la referencia
        return instancia


# Instancia global (se usa con el contexto del paciente)
# Usando Django Cache para compatibilidad con multi-proceso
MAX_SERVICIOS = 100  # Maximum number of concurrent services
CLEANUP_INTERVAL = 3600  # Cleanup every hour (in seconds)
CACHE_KEY_PREFIX = 'chatia_servicio_'
CACHE_KEYS_SET = 'chatia_servicios_keys'  # Track all active service keys


def _cleanup_servicios():
    """Elimina servicios antiguos para evitar fugas de memoria usando cache"""
    from django.core.cache import cache
    import time
    try:
        # Obtener todas las claves de servicios activos
        keys_list = cache.get(CACHE_KEYS_SET, [])
        
        if len(keys_list) <= MAX_SERVICIOS:
            return
        
        # Usar un lock distribuido para evitar race conditions en cleanup
        cleanup_lock_key = f"{CACHE_KEYS_SET}_cleanup_lock"
        # add() solo tiene éxito si la key no existe
        if not cache.add(cleanup_lock_key, '1', 60):
            # Otro proceso ya está haciendo cleanup
            return
            
        try:
            # Eliminar servicios más antiguos si excedemos el límite
            now = time.time()
            servicios_a_eliminar = []
            
            for paciente_id_str in list(keys_list):
                try:
                    paciente_id = int(paciente_id_str)
                    timestamp_key = f"{CACHE_KEY_PREFIX}{paciente_id}_ts"
                    timestamp = cache.get(timestamp_key, 0)
                    
                    # Eliminar servicios de más de 1 hora
                    if now - timestamp > CLEANUP_INTERVAL:
                        servicios_a_eliminar.append(paciente_id)
                except (ValueError, TypeError):
                    continue
            
            # Si aún tenemos demasiados, eliminar los más antiguos
            if len(keys_list) > MAX_SERVICIOS:
                # Obtenertimestamps
                timestamps = []
                for paciente_id_str in keys_list:
                    try:
                        paciente_id = int(paciente_id_str)
                        timestamp_key = f"{CACHE_KEY_PREFIX}{paciente_id}_ts"
                        timestamp = cache.get(timestamp_key, 0)
                        timestamps.append((paciente_id, timestamp))
                    except (ValueError, TypeError):
                        continue
                
                timestamps.sort(key=lambda x: x[1])
                excess = len(keys_list) - MAX_SERVICIOS
                for paciente_id, _ in timestamps[:excess]:
                    if paciente_id not in servicios_a_eliminar:
                        servicios_a_eliminar.append(paciente_id)
            
            # Eliminar los servicios marcados
            for paciente_id in servicios_a_eliminar:
                cache.delete(f"{CACHE_KEY_PREFIX}{paciente_id}")
                cache.delete(f"{CACHE_KEY_PREFIX}{paciente_id}_ts")
                if str(paciente_id) in keys_list:
                    keys_list.remove(str(paciente_id))
            
            cache.set(CACHE_KEYS_SET, keys_list)
        finally:
            # Liberar el lock
            cache.delete(cleanup_lock_key)
            
    except Exception as e:
        logger.warning(f"Error en cleanup de servicios de chat: {e}")


def obtener_servicio(paciente_id: int) -> Optional[ServicioIA]:
    """Obtiene o crea una instancia del servicio para un paciente usando Django cache"""
    from django.core.cache import cache
    import time
    import threading
    
    # Lock para prevenir race conditions en el mismo proceso
    _local_lock = threading.local()
    
    try:
        # Realizar cleanup ocasional - solo si no hay lock activo en este proceso
        if not hasattr(_local_lock, 'cleanup_done'):
            keys_list = cache.get(CACHE_KEYS_SET, [])
            if len(keys_list) > MAX_SERVICIOS * 0.8:
                _cleanup_servicios()
            _local_lock.cleanup_done = True
        
        # Intentar obtener el estado serializado
        estado_serializado = cache.get(f"{CACHE_KEY_PREFIX}{paciente_id}")
        
        # Obtener el paciente para recrear la instancia
        try:
            paciente = Paciente.objects.get(id=paciente_id)
        except Paciente.DoesNotExist:
            return None
        
        if estado_serializado is None:
            # Crear nueva instancia
            servicio = ServicioIA().inicializar(paciente)
            log_session_started(paciente.usuario)
            # Guardar solo el estado serializable
            cache.set(f"{CACHE_KEY_PREFIX}{paciente_id}", servicio.get_estado_serializable(), CLEANUP_INTERVAL)
            cache.set(f"{CACHE_KEY_PREFIX}{paciente_id}_ts", time.time(), CLEANUP_INTERVAL)
            
            # Usar operación atómica para agregar a la lista
            # Usar add() que solo tiene éxito si la key no existe
            lock_key = f"{CACHE_KEY_PREFIX}lock_{paciente_id}"
            if cache.add(lock_key, '1', 10):  # Lock expira en 10 segundos
                try:
                    keys_list = cache.get(CACHE_KEYS_SET) or []
                    if str(paciente_id) not in keys_list:
                        keys_list.append(str(paciente_id))
                        cache.set(CACHE_KEYS_SET, keys_list)
                finally:
                    cache.delete(lock_key)
        else:
            # Recrear instancia desde estado serializado
            servicio = ServicioIA.desde_estado(paciente, estado_serializado)
            # Actualizar timestamp de último uso
            cache.set(f"{CACHE_KEY_PREFIX}{paciente_id}_ts", time.time(), CLEANUP_INTERVAL)
        
        return servicio
    except Exception as e:
        logger.warning(f"Error al obtener servicio de chat para paciente {paciente_id}: {e}")
        # Si falla el cache, crear una instancia temporal (sin persistencia)
        try:
            paciente = Paciente.objects.get(id=paciente_id)
            servicio = ServicioIA().inicializar(paciente)
            servicio.sesion_restaurada = True  # Advertir al usuario sobre la pérdida de sesión
            logger.info(f"Creada instancia temporal de chat para paciente {paciente_id}")
            return servicio
        except Paciente.DoesNotExist:
            logger.error(f"Paciente {paciente_id} no encontrado")
            return None


def procesar_chat(paciente_id: int, mensaje: str) -> str:
    """Función principal para procesar un mensaje de chat"""
    logger.info(f"Chat request - Paciente: {paciente_id}, Mensaje: {mensaje[:50]}...")
    
    try:
        servicio = obtener_servicio(paciente_id)
        
        if servicio is None:
            logger.warning(f"Paciente no encontrado: {paciente_id}")
            return "Error: No se encontró el paciente. Por favor, inicia sesión nuevamente."
        
        # Advertir al usuario si su sesión fue restaurada desde backup
        if servicio.sesion_restaurada:
            respuesta_inicial = "⚠️ Tu sesión anterior se perdió debido a un problema técnico. Por favor, comienza de nuevo.\n\n"
            servicio.sesion_restaurada = False  # Resetear el flag después de mostrar el mensaje
        else:
            respuesta_inicial = ""
        
        respuesta, nuevo_estado = servicio.procesar_mensaje(mensaje)
        logger.debug(f"Estado cambiado a: {nuevo_estado}")

        # [FASE 5 §5.5] Loggear intención detectada
        _usuario = paciente.usuario if hasattr(paciente, 'usuario') else None
        if nuevo_estado == EstadoConversacion.CONFIRMAR:
            log_intent_detected(_usuario, 'confirmar', mensaje)
        elif nuevo_estado == EstadoConversacion.ESPECIALIDAD:
            log_intent_detected(_usuario, 'seleccionar_especialidad', mensaje)
        elif nuevo_estado == EstadoConversacion.DATA:
            log_intent_detected(_usuario, 'seleccionar_fecha', mensaje)
        elif nuevo_estado == EstadoConversacion.HORA:
            log_intent_detected(_usuario, 'seleccionar_hora', mensaje)
        elif nuevo_estado == EstadoConversacion.MEDICO:
            log_intent_detected(_usuario, 'seleccionar_medico', mensaje)
        elif nuevo_estado == EstadoConversacion.CANCELAR:
            log_intent_detected(_usuario, 'cancelar', mensaje)
        elif nuevo_estado == EstadoConversacion.VER_HORARIOS:
            log_intent_detected(_usuario, 'ver_horarios', mensaje)

        servicio.estado_actual = nuevo_estado
        
        # Guardar estado actualizado en cache para persistencia entre requests
        cache.set(f"{CACHE_KEY_PREFIX}{paciente_id}", 
                  servicio.get_estado_serializable(), 
                  CLEANUP_INTERVAL)
        
        logger.info(f"Chat response - Estado: {nuevo_estado}")
        return respuesta_inicial + respuesta
    except ValueError as e:
        logger.error(
            f"Error de valor al procesar chat para paciente {paciente_id}: {str(e)}",
            exc_info=True,
            extra={'paciente_id': paciente_id, 'mensaje_length': len(mensaje)}
        )
        # [FASE 5 §5.5] Loggear error
        try:
            log_error(paciente.usuario if servicio else None, e, context='procesar_chat')
        except Exception:
            pass
        return "😔 Hubo un problema con los datos proporcionados. Por favor, intenta de nuevo."
    except Exception as e:
        logger.error(
            f"Error inesperado al procesar chat para paciente {paciente_id}: {type(e).__name__}: {str(e)}",
            exc_info=True,
            extra={'paciente_id': paciente_id, 'mensaje_length': len(mensaje)}
        )
        # [FASE 5 §5.5] Loggear error
        try:
            log_error(paciente.usuario if servicio else None, e, context='procesar_chat')
        except Exception:
            pass
        return "😔 Ocurrió un error inesperado. Por favor, intenta de nuevo o contacta al administrador."

