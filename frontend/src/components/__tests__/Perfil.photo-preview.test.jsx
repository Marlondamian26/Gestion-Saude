import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../services/auth', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}))

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({ t: (key) => key })
}))

import axiosInstance from '../../services/auth'
import Perfil from '../Perfil'

describe('previsualizacion de foto en Mi Perfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.setItem('access_token', 'test-token')
    URL.createObjectURL = vi.fn(() => 'blob:foto-seleccionada')
    URL.revokeObjectURL = vi.fn()

    axiosInstance.get.mockImplementation(async (url) => {
      if (url === 'usuario-actual/') {
        return {
          data: {
            id: 8,
            rol: 'doctor',
            first_name: 'Ada',
            last_name: 'Lovelace',
            foto_perfil_url: 'https://example.com/foto-actual.jpg'
          }
        }
      }
      if (url === 'mi-perfil-doctor/') {
        return {
          data: {
            id: 12,
            usuario: { first_name: 'Ada', last_name: 'Lovelace' },
            especialidad: 'cardiologia',
            biografia: ''
          }
        }
      }
      if (url === 'citas/') return { data: [] }
      throw new Error(`Unexpected request: ${url}`)
    })
  })

  it('muestra la imagen elegida antes de guardar y elimina la previsualizacion al cancelar', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <MemoryRouter>
        <Perfil />
      </MemoryRouter>
    )

    await user.click(await screen.findByRole('button', { name: 'edit' }))

    const file = new File(['image data'], 'perfil.png', { type: 'image/png' })
    fireEvent.change(container.querySelector('input[type="file"]'), {
      target: { files: [file] }
    })

    const preview = await screen.findByRole('img', { name: 'newImageSelected' })
    expect(preview).toHaveAttribute('src', 'blob:foto-seleccionada')
    expect(screen.getByRole('img', { name: 'currentProfilePhoto' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Cancelar/ }))

    await waitFor(() => {
      expect(screen.queryByRole('img', { name: 'newImageSelected' })).not.toBeInTheDocument()
    })
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:foto-seleccionada')
  })
})
