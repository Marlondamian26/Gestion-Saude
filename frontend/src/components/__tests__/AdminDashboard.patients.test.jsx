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

const patient = {
  id: 21,
  usuario: {
    id: 7,
    username: 'patient7',
    first_name: 'Paula',
    last_name: 'Gomez',
    email: 'paula@example.com',
    telefono: '5551234',
    fecha_nacimiento: '1990-04-12',
    foto_perfil_url: null
  },
  alergias: 'Polen',
  grupo_sanguineo: 'O+',
  contacto_emergencia: 'Luis Gomez',
  telefono_emergencia: '5559876'
}

let patientExists

const response = (results = []) => ({ data: { count: results.length, results } })

const renderDashboard = async () => {
  localStorage.setItem('access_token', 'test-token')
  render(
    <MemoryRouter>
      <AdminDashboard />
    </MemoryRouter>
  )

  await screen.findByRole('button', { name: /patientsTab/ })
  await userEvent.click(screen.getByRole('button', { name: /patientsTab/ }))
}

describe('acciones de pacientes en AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    patientExists = true
    window.confirm = vi.fn(() => true)

    axiosInstance.get.mockImplementation(async (url) => {
      if (url === 'usuario-actual/') {
        return { data: { rol: 'admin' } }
      }
      if (url.startsWith('usuarios/')) {
        return response(patientExists ? [patient.usuario] : [])
      }
      if (url.startsWith('pacientes/')) {
        return response(patientExists ? [patient] : [])
      }
      return response()
    })
    axiosInstance.patch.mockResolvedValue({ data: {} })
    axiosInstance.post.mockResolvedValue({ data: {} })
    axiosInstance.delete.mockImplementation(async () => {
      patientExists = false
      return { data: {} }
    })
  })

  it('muestra la información del paciente al visualizarlo', async () => {
    const user = userEvent.setup()
    await renderDashboard()

    const row = screen.getByText('Paula Gomez').closest('tr')
    await user.click(within(row).getByTitle('view'))

    expect(screen.getByDisplayValue('patient7')).toBeDisabled()
    expect(screen.getByDisplayValue('Paula')).toBeDisabled()
    expect(screen.getByDisplayValue('Gomez')).toBeDisabled()
    expect(screen.getByDisplayValue('paula@example.com')).toBeDisabled()
    expect(screen.getByDisplayValue('Polen')).toBeDisabled()
  })

  it('precarga la información del paciente al editar y guarda los cambios', async () => {
    const user = userEvent.setup()
    await renderDashboard()

    const row = screen.getByText('Paula Gomez').closest('tr')
    await user.click(within(row).getByTitle('edit'))
    const firstName = screen.getByDisplayValue('Paula')
    expect(screen.getByDisplayValue('patient7')).toBeInTheDocument()
    expect(screen.getByDisplayValue('1990-04-12')).toBeInTheDocument()
    await user.clear(firstName)
    await user.type(firstName, 'Paulina')
    await user.click(screen.getByRole('button', { name: 'save' }))

    await waitFor(() => {
      expect(axiosInstance.patch).toHaveBeenCalledWith(
        'usuarios/7/',
        expect.objectContaining({ username: 'patient7', first_name: 'Paulina' })
      )
      expect(axiosInstance.patch).toHaveBeenCalledWith(
        'pacientes/21/',
        expect.objectContaining({ alergias: 'Polen', grupo_sanguineo: 'O+' })
      )
    })
  })

  it('elimina el usuario asociado y lo retira de ambos listados', async () => {
    const user = userEvent.setup()
    await renderDashboard()

    const row = screen.getByText('Paula Gomez').closest('tr')
    await user.click(within(row).getByTitle('delete'))

    await waitFor(() => {
      expect(axiosInstance.delete).toHaveBeenCalledWith('usuarios/7/')
    })
    await waitFor(() => {
      expect(screen.queryByText('Paula Gomez')).not.toBeInTheDocument()
    })
    expect(axiosInstance.get).toHaveBeenCalledWith('usuarios/?limit=1000')
    expect(axiosInstance.get).toHaveBeenCalledWith('pacientes/?limit=1000')
  })
})
