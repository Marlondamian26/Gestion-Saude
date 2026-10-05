/**
 * chatService.js — Funciones puras para llamadas API del asistente de citas.
 * Usa la instancia Axios existente (services/auth.js) con interceptors JWT.
 */
import axiosInstance from '../services/auth';

export const chatService = {
  /**
   * Obtiene el usuario actual con su rol.
   */
  async getUsuarioActual() {
    const response = await axiosInstance.get('usuario-actual/');
    return response.data;
  },

  /**
   * Obtiene la lista de especialidades públicas.
   */
  async getEspecialidades() {
    const response = await axiosInstance.get('especialidades-publicas/');
    return Array.isArray(response.data)
      ? response.data
      : (response.data.results || []);
  },

  /**
   * Obtiene la lista de doctores públicos.
   */
  async getDoctores() {
    const response = await axiosInstance.get('doctores-publicos/');
    return Array.isArray(response.data)
      ? response.data
      : (response.data.results || []);
  },

  /**
   * Busca horarios disponibles de un doctor para una fecha.
   */
  async getHorariosDisponibles(doctorId, fecha) {
    const response = await axiosInstance.get(
      `horarios/disponibles/?doctor=${doctorId}&fecha=${fecha}`
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Obtiene citas de un doctor para una fecha (para filtrar horas ocupadas).
   */
  async getCitasOcupadas(doctorId, fecha) {
    const response = await axiosInstance.get('citas/', {
      params: { doctor: doctorId, fecha },
    });
    return Array.isArray(response.data)
      ? response.data
      : (response.data.results || []);
  },

  /**
   * Crea una nueva cita.
   */
  async crearCita(requestBody) {
    const response = await axiosInstance.post('citas/', requestBody);
    return response;
  },

  /**
   * Obtiene las citas del paciente/usuario actual.
   */
  async getMisCitas() {
    const response = await axiosInstance.get('mis-citas/');
    return Array.isArray(response.data)
      ? response.data
      : (response.data.results || []);
  },

  /**
   * Obtiene todas las citas (para admin/doctor).
   */
  async getCitas(params = {}) {
    const response = await axiosInstance.get('citas/', { params });
    return Array.isArray(response.data)
      ? response.data
      : (response.data.results || []);
  },

  /**
   * Busca pacientes por query string.
   */
  async buscarPacientes(query) {
    const response = await axiosInstance.get('buscar-pacientes/', {
      params: { query },
    });
    return response.data.resultados || [];
  },

  /**
   * Cancela una cita.
   */
  async cancelarCita(citaId) {
    return axiosInstance.post(`citas/${citaId}/cancelar/`);
  },

  /**
   * Postonea una cita.
   */
  async posponerCita(citaId, data) {
    return axiosInstance.patch(`citas/${citaId}/`, data);
  },

  /**
   * Obtiene horarios semanales de un doctor.
   */
  async getHorariosSemana(doctorId) {
    const response = await axiosInstance.get(
      `horarios/disponibles/?doctor=${doctorId}`
    );
    const horarios = Array.isArray(response.data) ? response.data : [];
    return [...new Set(horarios.map((h) => h.dia_semana))];
  },
};

export default chatService;
