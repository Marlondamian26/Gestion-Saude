import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import UserSearchBar from '../UserSearchBar'

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key, params = {}) => {
      const map = {
        searchUsersLabel: 'Buscar usuarios',
        searchUsersPlaceholder: 'Buscar por nombre, usuario o email…',
        searchResults: 'Mostrando {resultCount} de {totalCount} usuarios',
        searchResultsFor: '{resultCount} resultados para «{query}»',
        clearSearch: 'Limpiar búsqueda',
      }
      let text = map[key] || key
      Object.keys(params).forEach((param) => {
        text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), params[param])
      })
      return text
    },
  }),
}))

describe('UserSearchBar', () => {
  const mockOnChange = vi.fn()
  const mockOnClear = vi.fn()

  beforeEach(() => {
    mockOnChange.mockReset()
    mockOnClear.mockReset()
  })

  it('renderiza el input, el icono y el contador', () => {
    render(
      <UserSearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
        resultCount={2}
        totalCount={10}
      />
    )
    expect(screen.getByPlaceholderText('Buscar por nombre, usuario o email…')).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar usuarios')).toBeInTheDocument()
    expect(screen.getByText('Mostrando 2 de 10 usuarios')).toBeInTheDocument()
  })

  it('el input es de tipo search y tiene aria-describedby al contador', () => {
    render(<UserSearchBar value="" onChange={mockOnChange} onClear={mockOnClear} />)
    const input = screen.getByPlaceholderText('Buscar por nombre, usuario o email…')
    expect(input).toHaveAttribute('type', 'search')
    const counter = screen.getByText('Mostrando 0 de 0 usuarios')
    expect(input).toHaveAttribute('aria-describedby', counter.id)
  })

  it('anuncia cambios del contador con aria-live polite', () => {
    render(<UserSearchBar value="" onChange={mockOnChange} onClear={mockOnClear} resultCount={3} totalCount={10} />)
    expect(screen.getByText('Mostrando 3 de 10 usuarios')).toHaveAttribute('aria-live', 'polite')
  })

  it('llama onChange al escribir', async () => {
    const user = userEvent.setup()
    render(<UserSearchBar value="" onChange={mockOnChange} onClear={mockOnClear} />)
    const input = screen.getByPlaceholderText('Buscar por nombre, usuario o email…')
    await user.type(input, 'juan')
    expect(mockOnChange).toHaveBeenLastCalledWith('n')
  })

  it('no muestra el botón limpiar cuando está vacío', () => {
    render(<UserSearchBar value="" onChange={mockOnChange} onClear={mockOnClear} />)
    expect(screen.queryByRole('button', { name: 'Limpiar búsqueda' })).not.toBeInTheDocument()
  })

  it('llama onClear al hacer click en el botón limpiar', () => {
    render(
      <UserSearchBar value="juan" onChange={mockOnChange} onClear={mockOnClear} />
    )
    const clearBtn = screen.getByRole('button', { name: 'Limpiar búsqueda' })
    expect(clearBtn).toBeInTheDocument()
    fireEvent.click(clearBtn)
    expect(mockOnClear).toHaveBeenCalled()
  })

  it('muestra "resultados para" cuando hay query', () => {
    render(
      <UserSearchBar
        value="juan"
        onChange={mockOnChange}
        onClear={mockOnClear}
        resultCount={1}
        totalCount={10}
        query="juan"
      />
    )
    expect(screen.getByText('1 resultados para «juan»')).toBeInTheDocument()
  })

  it('cuando no hay resultados y hay query muestra 0 resultados', () => {
    render(
      <UserSearchBar
        value="zzz"
        onChange={mockOnChange}
        onClear={mockOnClear}
        resultCount={0}
        totalCount={10}
        query="zzz"
      />
    )
    expect(screen.getByText('0 resultados para «zzz»')).toBeInTheDocument()
  })
})
