/**
 * Utilidades para manejar iconos de emergencia
 * Convierte nombres de iconos de Material Icons a emojis
 */

// Mapeo de nombres de iconos de Material Icons a emojis
const MATERIAL_ICON_TO_EMOJI = {
  // Médico / Salud
  'medical_services': '🚑',
  'local_hospital': '🏥',
  'health_and_safety': '🏥',
  'emergency': '🆘',
  'first_aid': '🩹',
  'medication': '💊',
  'coronavirus': '🦠',
  'masks': '😷',
  'sanitizer': '🧴',

  // Transporte / Vehículos
  'car_crash': '🚗',
  'directions_car': '🚗',
  'flight': '✈️',
  'directions_bus': '🚌',
  'directions_boat': '🚢',

  // Seguridad
  'person_search': '🔍',
  'security': '🛡️',
  'local_police': '👮',
  'gavel': '⚖️',

  // Clima / Desastres naturales
  'storm': '⛈️',
  'water_damage': '💧',
  'flood': '🌊',
  'fire_extinguisher': '🔥',
  'whatshot': '🔥',
  'ac_unit': '❄️',
  'thunderstorm': '⛈️',

  // Eléctrico / Técnico
  'electrical_services': '⚡',
  'power': '⚡',
  'bolt': '⚡',

  // Comunicación
  'phone': '📞',
  'radio': '📡',
  'cell_tower': '📡',
  'wifi': '📶',

  // Actividades / Turismo
  'hiking': '🥾',
  'terrain': '⛰️',
  'landscape': '🏔️',
  'forest': '🌲',
  'beach_access': '🏖️',

  // Personas
  'pets': '🐕',
  'child_care': '👶',
  'elderly': '👴',
  'accessibility': '♿',
  'groups': '👥',
  'person': '👤',

  // Alertas
  'warning': '⚠️',
  'error': '❌',
  'info': 'ℹ️',
  'help': '❓',

  // Otros
  'description': '📄',
  'article': '📰',
  'folder': '📁',
  'inventory': '📦',
  'backpack': '🎒',
  'luggage': '🧳'
};

/**
 * Convierte nombres de iconos de Material Icons a emojis
 * @param {string} iconValue - El valor del icono (puede ser emoji o nombre de Material Icon)
 * @returns {string} - El emoji correspondiente o el valor por defecto
 */
export const getIconDisplay = (iconValue) => {
  // Si es nulo o undefined, devolver emoji por defecto
  if (!iconValue) return '📋';

  // Si ya es un emoji (caracteres cortos que no son snake_case), devolverlo
  if (iconValue.length <= 4 && !/^[a-z_]+$/.test(iconValue)) {
    return iconValue;
  }

  // Si es un nombre de icono de Material (snake_case), convertirlo
  if (typeof iconValue === 'string' && iconValue.includes('_')) {
    return MATERIAL_ICON_TO_EMOJI[iconValue] || '📋';
  }

  // Intentar buscar en el mapeo de todas formas
  return MATERIAL_ICON_TO_EMOJI[iconValue] || iconValue || '📋';
};

export default getIconDisplay;
