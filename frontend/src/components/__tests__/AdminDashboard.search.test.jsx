import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../services/auth', () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
    post: vi.fn()
  }
}))

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({ t: (key) => key })
}))

vi.mock('../ChatIA', () => ({
  default: () => null
}))

import axiosInstance from '../../services/auth'
import AdminDashboard from '../AdminDashboard'

const usuarioActual = { data: { id: 1, username: 'admin', rol: 'admin' } }

const usuarios = [
  { id: 1, username: 'juan.perez', first_name: 'Juan', last_name: 'Pérez', email: 'juan@example.com', telefono: '111', rol: 'patient' },
  { id: 2, username: 'maria.gomez', first_name: 'María', last_name: 'Gómez', email: 'maria@example.com', telefono: '222', rol: 'doctor' },
  { id: 3, username: 'jose.lopez', first_name: 'José', last_name: 'López', email: 'jose@example.com', telefono: '333', rol: 'nurse' },
  { id: 4, username: 'ana.ruiz', first_name: 'Ana', last_name: 'Ruiz', email: 'ana@example.com', telefono: '444', rol: 'admin' },
]

const pacientes = [
  {
    id: 101, usuario: { id: 1, username: 'juan.perez', first_name: 'Juan', last_name: 'Pérez', email: 'juan@example.com', telefono: '111', rol: 'patient' },
    grupo_sanguineo: 'O+', contacto_emergencia: 'Luis', telefono_emergencia: '555'
  },
  {
    id: 102, usuario: { id: 5, username: 'luisa.martin', first_name: 'Luisa', last_name: 'Martín', email: 'luisa@example.com', telefono: '666', rol: 'patient' },
    grupo_sanguineo: 'A-', contacto_emergencia: 'Carlos', telefono_emergencia: '777'
  }
]

const response = (results = []) => ({ data: { count: results.length, results } })

const renderDashboard = async () => {
  localStorage.setItem('access_token', 'test-token')
  render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  )
}

describe('gestión de usuarios y pacientes (sin regresión + búsqueda)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.confirm = vi.fn(() => true)
    axiosInstance.get.mockImplementation(async (url) => {
      if (url === 'usuario-actual/') return usuarioActual
      if (url.startsWith('usuarios/')) return response(usuarios)
      if (url.startsWith('pacientes/')) return response(pacientes)
      return response()
    })
    axiosInstance.patch.mockResolvedValue({ data: {} })
    axiosInstance.post.mockResolvedValue({ data: {} })
    axiosInstance.delete.mockResolvedValue({ data: {} })
  })

  describe('Gestionar Usuarios', () => {
    it('muestra todos los usuarios con query vacía', async () => {
      const user = userEvent.setup()
      await renderDashboard()
      await screen.findByRole('button', { name: /manageUsers/ })
      await user.click(screen.getByRole('button', { name: /manageUsers/ }))

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('María Gómez')).toBeInTheDocument()
        expect(screen.getByText('José López')).toBeInTheDocument()
        expect(screen.getByText('Ana Ruiz')).toBeInTheDocument()
      })
    })

    it('renderiza el cuadro de búsqueda con atributos de accesibilidad', async () => {
      const user = userEvent.setup()
      await renderDashboard()
      await screen.findByRole('button', { name: /manageUsers/ })
      await user.click(screen.getByRole('button', { name: /manageUsers/ }))

      const input = screen.getByPlaceholderText('searchUsersPlaceholder')
      expect(input).toHaveAttribute('type', 'search')
      expect(input).toHaveAttribute('aria-label', 'searchUsersLabel')
      const counter = screen.getByText('searchResults')
      expect(input).toHaveAttribute('aria-describedby', counter.id)
      expect(counter).toHaveAttribute('aria-live', 'polite')
      // Sin texto, no hay botón limpiar (nombre accesible = clave de traducción en este entorno)
      expect(screen.queryByRole('button', { name: 'clearSearch' })).not.toBeInTheDocument()
    })

    it('filtra en tiempo real al teclear en el input', async () => {
      const user = userEvent.setup()
      await renderDashboard()
      await screen.findByRole('button', { name: /manageUsers/ })
      await user.click(screen.getByRole('button', { name: /manageUsers/ }))

      const input = screen.getByPlaceholderText('searchUsersPlaceholder')
      await user.clear(input)
      await user.type(input, 'ana')
      await waitFor(() => {
        expect(screen.getByText('Ana Ruiz')).toBeInTheDocument()
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
        expect(screen.queryByText('María Gómez')).not.toBeInTheDocument()
        expect(screen.queryByText('José López')).not.toBeInTheDocument()
      })
    })

    it('encuentra acento sin acento: "jose" encuentra "José"', async () => {
      const user = userEvent.setup()
      await renderDashboard()
      await screen.findByRole('button', { name: /manageUsers/ })
      await user.click(screen.getByRole('button', { name: /manageUsers/ }))

      const input = screen.getByPlaceholderText('searchUsersPlaceholder')
      await user.clear(input)
      await user.type(input, 'jose')
      await waitFor(() => {
        expect(screen.getByText('José López')).toBeInTheDocument()
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
      })
    })

    it('limpiar búsqueda devuelve la lista completa', async () => {
      const user = userEvent.setup()
      await renderDashboard()
      await screen.findByRole('button', { name: /manageUsers/ })
      await user.click(screen.getByRole('button', { name: /manageUsers/ }))

      const input = screen.getByPlaceholderText('searchUsersPlaceholder')
      await user.clear(input)
      await user.type(input, 'ana')
      await waitFor(() => {
        expect(screen.queryByText('María Gómez')).not.toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: 'clearSearch' }))
      await waitFor(() => {
        expect(screen.getByText('María Gómez')).toBeInTheDocument()
        expect(screen.getByText('Ana Ruiz')).toBeInTheDocument()
      })
    })

    it('muestra estado "sin resultados" diferenciado del vacío original', async () => {
      const user = userEvent.setup()
      await renderDashboard()
      await screen.findByRole('button', { name: /manageUsers/ })
      await user.click(screen.getByRole('button', { name: /manageUsers/ }))

      const input = screen.getByPlaceholderText('searchUsersPlaceholder')
      await user.clear(input)
      await user.type(input, 'zzz')
      await waitFor(() => {
        expect(screen.getByText('searchNoResults')).toBeInTheDocument()
      })
    })

    it('las acciones por fila siguen funcionando (ver detalle)', async () => {
      const user = userEvent.setup()
      await renderDashboard()
      await screen.findByRole('button', { name: /manageUsers/ })
      await user.click(screen.getByRole('button', { name: /manageUsers/ }))

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
      })

      const row = screen.getByText('Juan Pérez').closest('tr')
      await user.click(within(row).getByTitle('view'))
      await waitFor(() => {
        expect(screen.getByDisplayValue('juan.perez')).toBeDisabled()
      })
    })
  })

  describe('Gestionar Pacientes', () => {
    it('muestra solo pacientes y nunca un no-paciente', async () => {
      const user = userEvent.setup()
      await renderDashboard()
      await screen.findByRole('button', { name: /patientsTab/ })
      await user.click(screen.getByRole('button', { name: /patientsTab/ }))

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('Luisa Martín')).toBeInTheDocument()
      })

      // María Gómez (doctor) está en la lista de usuarios pero NO entre los pacientes
      expect(screen.queryByText('María Gómez')).not.toBeInTheDocument()
    })

    it('filtra pacientes por nombre (solo pacientes, nunca un no-paciente)', async () => {
      const user = userEvent.setup()
      await renderDashboard()
      await screen.findByRole('button', { name: /patientsTab/ })
      await user.click(screen.getByRole('button', { name: /patientsTab/ }))

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('Luisa Martín')).toBeInTheDocument()
      })

      const input = screen.getByPlaceholderText('searchUsersPlaceholder')
      await user.clear(input)
      await user.type(input, 'luisa')
      await waitFor(() => {
        expect(screen.getByText('Luisa Martín')).toBeInTheDocument()
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument()
        expect(screen.queryByText('María Gómez')).not.toBeInTheDocument()
      })
    })
  })

  describe('reset de búsqueda al cambiar de sección', () => {
    it('no arrastra la query al pasar de Usuarios a Pacientes', async () => {
      const user = userEvent.setup()
      await renderDashboard()
      await screen.findByRole('button', { name: /manageUsers/ })
      await user.click(screen.getByRole('button', { name: /manageUsers/ }))

      // Campo de búsqueda vacío al entrar a Usuarios
      expect(screen.getByPlaceholderText('searchUsersPlaceholder')).toHaveValue('')

      await user.click(screen.getByRole('button', { name: /patientsTab/ }))
      await waitFor(() => {
        expect(screen.getByPlaceholderText('searchUsersPlaceholder')).toHaveValue('')
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument()
        expect(screen.getByText('Luisa Martín')).toBeInTheDocument()
      })
    })
  })
})
