/**
 * searchUsers.js — Utilidad pura de filtrado incremental de usuarios.
 * Extraída para reutilizarse en el chatbot y en las secciones de gestión
 * del AdminDashboard (Gestionar Usuarios / Gestionar Pacientes).
 * No introduce dependencias: solo JavaScript nativo.
 */

/**
 * Normaliza una cadena para comparación de búsqueda:
 * minúsculas, elimina tildes/acentos y espacios extremos.
 * Ejemplo: "José  " -> "jose"
 * @param {string|undefined|null} str
 * @returns {string}
 */
export const normalize = (str) =>
  String(str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

/**
 * Filtra un array de usuarios por una consulta de búsqueda sin mutar el original.
 * @param {Array} users - array de objetos usuario
 * @param {string} query - texto de búsqueda
 * @param {Object} [options]
 * @param {string[]} [options.fields=['username','first_name','last_name','email']]
 * @param {'includes'|'startsWith'} [options.mode='includes']
 * @returns {Array} nuevo array con los usuarios que coinciden
 */
export const filterUsers = (
  users,
  query,
  {
    fields = ['username', 'first_name', 'last_name', 'email'],
    mode = 'includes',
  } = {}
) => {
  if (!Array.isArray(users)) return [];

  const term = normalize(query);
  if (!term) return users;

  return users.filter((user) => {
    if (!user || typeof user !== 'object') return false;
    return fields.some((field) => {
      const value = normalize(user[field]);
      if (mode === 'startsWith') return value.startsWith(term);
      return value.includes(term);
    });
  });
};
