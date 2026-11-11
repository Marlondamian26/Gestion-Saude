import { describe, it, expect } from 'vitest'
import { filterUsers, normalize } from '../searchUsers'

const users = [
  { id: 1, username: 'juan.perez', first_name: 'Juan', last_name: 'Pérez', email: 'juan@example.com', rol: 'patient' },
  { id: 2, username: 'maria.gomez', first_name: 'María', last_name: 'Gómez', email: 'maria@example.com', rol: 'doctor' },
  { id: 3, username: 'jose.lopez', first_name: 'José', last_name: 'López', email: 'jose@example.com', rol: 'nurse' },
  { id: 4, username: 'ana', first_name: 'Ana', last_name: 'Ruiz', email: 'ana.ruiz@mail.com', rol: 'admin' },
]

describe('filterUsers', () => {
  it('query vacía devuelve todos los usuarios (misma referencia)', () => {
    expect(filterUsers(users, '')).toBe(users)
    expect(filterUsers(users, '   ')).toBe(users)
    expect(filterUsers(users, undefined)).toBe(users)
    expect(filterUsers(users, null)).toBe(users)
  })

  it('array vacío devuelve array vacío', () => {
    expect(filterUsers([], 'juan')).toEqual([])
  })

  it('búsqueda por nombre, case-insensitive', () => {
    expect(filterUsers(users, 'JUAN')).toHaveLength(1)
    expect(filterUsers(users, 'juan')[0].id).toBe(1)
  })

  it('normaliza acentos: "jose" encuentra "José"', () => {
    const result = filterUsers(users, 'jose')
    expect(result.map((u) => u.id).sort()).toEqual([3])
  })

  it('búsqueda por apellido con acento', () => {
    expect(filterUsers(users, 'lópez')[0].id).toBe(3)
    expect(filterUsers(users, 'lopez')[0].id).toBe(3)
  })

  it('búsqueda por email', () => {
    expect(filterUsers(users, 'example.com')).toHaveLength(3)
    expect(filterUsers(users, 'mail.com')[0].id).toBe(4)
  })

  it('búsqueda por username', () => {
    expect(filterUsers(users, 'maria')[0].id).toBe(2)
  })

  it('aplica trim al query', () => {
    expect(filterUsers(users, '  juan  ')[0].id).toBe(1)
  })

  it('query sin coincidencias devuelve array vacío', () => {
    expect(filterUsers(users, 'zzz')).toEqual([])
  })

  it('no muta el array original', () => {
    const before = [...users]
    filterUsers(users, 'juan')
    expect(users).toEqual(before)
  })

  it('mode startsWith vs includes', () => {
    expect(filterUsers(users, 'ez', { mode: 'includes' })).toHaveLength(3) // Pérez, Gómez, López
    expect(filterUsers(users, 'ez', { mode: 'startsWith' })).toHaveLength(0)
    expect(filterUsers(users, 'ju', { mode: 'startsWith' })).toHaveLength(1)
  })

  it('campos personalizados', () => {
    expect(filterUsers(users, 'admin', { fields: ['rol'] })).toHaveLength(1)
  })
})

describe('normalize', () => {
  it('minúsculas, sin acentos y sin espacios', () => {
    expect(normalize('José  ')).toBe('jose')
    expect(normalize('MARÍA')).toBe('maria')
    expect(normalize(null)).toBe('')
    expect(normalize(undefined)).toBe('')
  })
})
