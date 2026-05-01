import {
  DATE_FORMATS,
  USER_ROLE_COLORS,
  USER_STATUS_COLORS
} from '../constants/usersConstants';

// Format helpers
export const formatLastLogin = (lastLogin) => {
  if (!lastLogin) return null;
  const date = new Date(lastLogin);
  return {
    date: date.toLocaleDateString(DATE_FORMATS.LOCALE),
    time: date.toLocaleTimeString(DATE_FORMATS.LOCALE, DATE_FORMATS.DATE_TIME_FORMAT)
  };
};

export const formatFullDateTime = (lastLogin) => {
  const formatted = formatLastLogin(lastLogin);
  if (!formatted) return 'Nunca';
  return `${formatted.date} ${formatted.time}`;
};

// Role helpers
export const getRoleColor = (roleId, roles = []) => {
  // Si roleId es un objeto, extraer el id
  const id = typeof roleId === 'object' ? roleId?.id : roleId;
  const role = roles.find(r => r.id === id);
  return role?.color || USER_ROLE_COLORS[id] || 'gray';
};

export const getRoleName = (roleId, roles = []) => {
  // Si roleId es un objeto, devolver su nombre directamente
  if (typeof roleId === 'object' && roleId !== null) {
    return roleId.name || roleId.displayName || 'Unknown';
  }
  // Si roleId es un string/número, buscar en la lista de roles
  const role = roles.find(r => r.id === roleId);
  return role?.name || role?.displayName || roleId || 'Unknown';
};

// Mapeo de clases completas de Tailwind para roles
// Tailwind no soporta construcción dinámica de clases, necesitamos las clases completas
const ROLE_CLASS_MAP = {
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  purple: 'bg-purple-100 text-purple-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  red: 'bg-red-100 text-red-800',
  indigo: 'bg-indigo-100 text-indigo-800',
  pink: 'bg-pink-100 text-pink-800',
  gray: 'bg-gray-100 text-gray-800'
};

export const getRoleClasses = (roleId, roles = []) => {
  const color = getRoleColor(roleId, roles);
  return ROLE_CLASS_MAP[color] || ROLE_CLASS_MAP.gray;
};

// Status helpers
export const getStatusClasses = (status) => {
  const colors = USER_STATUS_COLORS[status];
  if (!colors) return USER_STATUS_COLORS['inactive'] || 'bg-gray-100 text-gray-800';
  return colors;
};