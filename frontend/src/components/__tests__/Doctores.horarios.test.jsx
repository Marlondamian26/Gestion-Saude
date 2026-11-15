import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

const mockGet = vi.hoisted(() => vi.fn())
vi.mock('../../services/auth', () => ({
  default: { get: mockGet },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const tMap = {
  ourSpecialists: 'Nuestros Especialistas',
  back: 'Volver',
  filterBySpecialty: 'Filtrar por especialidad',
  allSpecialties: 'Todas las especialidades',
  viewAvailability: 'Ver disponibilidad',
  professionalInfo: 'Información Profesional',
  biography: 'Biografía',
  notSpecified: 'No especificada',
  contact: 'Contacto',
  officeHours: 'Horarios de Atención',
  noScheduleConfigured: 'No hay horarios configurados',
  bookAppointmentBtn: 'Reservar Cita',
  noSpecialistsFound: 'No se encontraron especialistas',
  withSpecialty: 'con especialidad',
  loading: 'Cargando...',
  dr: 'Dr.',
  nurseShort: 'Enf.',
  monday: 'Lunes',
  tuesday: 'Martes',
  wednesday: 'Miércoles',
  thursday: 'Jueves',
  friday: 'Viernes',
  saturday: 'Sábado',
  sunday: 'Domingo',
}

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({ t: (key) => tMap[key] || key }),
}))

import Doctores from '../Doctores'

const renderDoctores = () => render(<MemoryRouter><Doctores /></MemoryRouter>)

const baseDoctor = {
  id: 1,
  tipo: 'doctor',
  usuario: {
    first_name: 'Belkis',
    last_name: 'Morejón',
    foto_perfil_url: null,
    telefono: '123',
    email: 'b@test.com',
  },
  especialidad_nombre: 'Medicina General',
  otra_especialidad: '',
  biografia: 'Bio',
}

const horariosPaginados = {
  count: 1,
  next: null,
  previous: null,
  results: [
    { id: 1, doctor: 1, dia_semana: 0, hora_inicio: '09:00:00', hora_fin: '10:00:00', activo: true },
  ],
}

describe('Doctores — horarios de atención en el modal', () => {
  beforeEach(() => {
    mockGet.mockReset()
    localStorage.clear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('muestra los horarios reales cuando la API responde paginada (causa del bug)', async () => {
    mockGet.mockImplementation((url) => {
      if (url.includes('especialistas-publicos')) {
        return Promise.resolve({ data: [baseDoctor] })
      }
      if (url.includes('horarios/?doctor=')) {
        return Promise.resolve({ data: horariosPaginados })
      }
      return Promise.resolve({ data: [] })
    })

    renderDoctores()
    await waitFor(() => expect(screen.getByText(/Ver disponibilidad/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Ver disponibilidad/))

    await waitFor(() => expect(screen.getByText('Lunes:')).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText('09:00:00 - 10:00:00')).toBeInTheDocument())
    expect(screen.queryByText('No hay horarios configurados')).not.toBeInTheDocument()
  })

  it('muestra "No hay horarios configurados" cuando el doctor no tiene horarios', async () => {
    mockGet.mockImplementation((url) => {
      if (url.includes('especialistas-publicos')) {
        return Promise.resolve({ data: [baseDoctor] })
      }
      if (url.includes('horarios/?doctor=')) {
        return Promise.resolve({ data: { count: 0, next: null, previous: null, results: [] } })
      }
      return Promise.resolve({ data: [] })
    })

    renderDoctores()
    await waitFor(() => expect(screen.getByText(/Ver disponibilidad/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Ver disponibilidad/))

    await waitFor(() => expect(screen.getByText('No hay horarios configurados')).toBeInTheDocument())
  })

  it('no rompe el modal ni el botón Reservar Cita ante error de red al cargar horarios', async () => {
    mockGet.mockImplementation((url) => {
      if (url.includes('especialistas-publicos')) {
        return Promise.resolve({ data: [baseDoctor] })
      }
      if (url.includes('horarios/?doctor=')) {
        return Promise.reject(new Error('Error de red'))
      }
      return Promise.resolve({ data: [] })
    })

    renderDoctores()
    await waitFor(() => expect(screen.getByText(/Ver disponibilidad/)).toBeInTheDocument())
    fireEvent.click(screen.getByText(/Ver disponibilidad/))

    await waitFor(() => expect(screen.getByText('No hay horarios configurados')).toBeInTheDocument())
    expect(screen.getByText(/Reservar Cita/)).toBeInTheDocument()
  })
})
