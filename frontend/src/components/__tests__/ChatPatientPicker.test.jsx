/**
 * Tests para ChatPatientPicker (§12.1.5).
 * Verifica el renderizado del input de búsqueda, sugerencias y estado vacío.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ChatPatientPicker from '../chat/ChatPatientPicker';

vi.mock('../../context/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key) => {
      const map = {
        typeToSearchPatient: 'Digite o nome do paciente...',
        noPatientsFound: 'Nenhum paciente encontrado',
        loading: 'Carregando...',
      };
      return map[key] || key;
    },
    language: 'pt',
  }),
}));

describe('ChatPatientPicker', () => {
  const mockOnBuscar = vi.fn();
  const mockOnSelectar = vi.fn();

  beforeEach(() => {
    mockOnBuscar.mockReset();
    mockOnSelectar.mockReset();
  });

  it('renderiza el input de búsqueda al montar (no retorna null con busqueda vacía)', () => {
    render(
      <ChatPatientPicker
        busqueda=""
        sugerencias={[]}
        mostrar={false}
        loading={false}
        onBuscar={mockOnBuscar}
        onSelectar={mockOnSelectar}
      />
    );
    expect(
      screen.getByPlaceholderText('Digite o nome do paciente...')
    ).toBeInTheDocument();
  });

  it('llama onBuscar con el valor al escribir (1 caractér → pasa al handler)', () => {
    render(
      <ChatPatientPicker
        busqueda=""
        sugerencias={[]}
        mostrar={false}
        loading={false}
        onBuscar={mockOnBuscar}
        onSelectar={mockOnSelectar}
      />
    );
    const input = screen.getByPlaceholderText('Digite o nome do paciente...');
    fireEvent.change(input, { target: { value: 'J' } });
    expect(mockOnBuscar).toHaveBeenCalledWith('J');
  });

  it('muestra resultados de sugerencias cuando mostrar es true', () => {
    const sugerencias = [
      { id: 1, display_text: 'Juan Pérez', foto_perfil: null },
      { id: 2, display_text: 'Juana Gómez', foto_perfil: null },
    ];
    render(
      <ChatPatientPicker
        busqueda="Juan"
        sugerencias={sugerencias}
        mostrar={true}
        loading={false}
        onBuscar={mockOnBuscar}
        onSelectar={mockOnSelectar}
      />
    );
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Juana Gómez')).toBeInTheDocument();
  });

  it('llama onSelectar con el paciente al click en una sugerencia', () => {
    const paciente = { id: 1, display_text: 'Juan Pérez', foto_perfil: null };
    render(
      <ChatPatientPicker
        busqueda="Juan"
        sugerencias={[paciente]}
        mostrar={true}
        loading={false}
        onBuscar={mockOnBuscar}
        onSelectar={mockOnSelectar}
      />
    );
    fireEvent.click(screen.getByText('Juan Pérez'));
    expect(mockOnSelectar).toHaveBeenCalledWith(paciente);
  });

  it('muestra estado vacío cuando no hay resultados', () => {
    render(
      <ChatPatientPicker
        busqueda="xyz"
        sugerencias={[]}
        mostrar={true}
        loading={false}
        onBuscar={mockOnBuscar}
        onSelectar={mockOnSelectar}
      />
    );
    expect(screen.getByText('Nenhum paciente encontrado')).toBeInTheDocument();
  });

  it('deshabilita el input cuando loading es true', () => {
    render(
      <ChatPatientPicker
        busqueda=""
        sugerencias={[]}
        mostrar={false}
        loading={true}
        onBuscar={mockOnBuscar}
        onSelectar={mockOnSelectar}
      />
    );
    expect(
      screen.getByPlaceholderText('Digite o nome do paciente...')
    ).toBeDisabled();
  });
});
