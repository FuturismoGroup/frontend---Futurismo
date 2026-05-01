/**
 * Utilidades para manejo de íconos
 * Convierte nombres de íconos de Material Design a emojis
 */

/**
 * Mapeo de nombres de íconos de Material Design a emojis
 * Los íconos en la BD pueden estar guardados como nombres de Material Icons
 */
export const ICON_NAME_TO_EMOJI = {
  // Seguridad
  security: '🛡️',
  shield: '🛡️',
  lock: '🔒',
  verified_user: '✅',
  robo: '🛡️',
  asalto: '🛡️',

  // Vehículos / Accidentes
  car_crash: '🚗',
  car: '🚗',
  directions_car: '🚗',
  local_shipping: '🚚',
  accidente: '🚗',
  vehicular: '🚗',

  // Advertencias / Alertas
  warning: '⚠️',
  error: '❌',
  report_problem: '⚠️',
  notification_important: '🔔',
  desastre: '⚠️',
  natural: '🌊',

  // Emergencias
  emergency: '🚨',
  local_hospital: '🏥',
  medical_services: '🏥',
  health_and_safety: '🩺',
  medico: '🏥',
  salud: '🩺',

  // Naturaleza / Clima
  storm: '⛈️',
  thunderstorm: '⛈️',
  flood: '🌊',
  earthquake: '🌋',
  nature: '🌿',
  forest: '🌲',
  terremoto: '🌋',
  inundacion: '🌊',

  // Fuego
  local_fire_department: '🔥',
  fire: '🔥',
  whatshot: '🔥',
  incendio: '🔥',

  // Personas
  person: '👤',
  people: '👥',
  group: '👥',
  perdido: '👤',
  extraviado: '👤',

  // Comunicación
  phone: '📞',
  call: '📞',
  contact_phone: '📞',

  // Equipamiento
  medical: '🏥',
  kit: '🧰',
  tools: '🔧',
  equipment: '📦',
  primeros_auxilios: '🩹',
  botiquin: '🩹',

  // Otros
  help: '❓',
  info: 'ℹ️',
  check_circle: '✅',
  cancel: '❌',
  build: '🔧',
  settings: '⚙️',
  favorite: '❤️',
  star: '⭐',
  general: '📋',
  otro: '📋',

  // Default
  default: '📦'
};

/**
 * Convierte un nombre de ícono o texto a emoji
 * Si ya es un emoji, lo devuelve tal cual
 * Si es un nombre de ícono conocido, lo convierte
 * Si no se reconoce, devuelve el ícono por defecto
 *
 * @param {string} icon - Nombre del ícono o emoji
 * @returns {string} Emoji correspondiente
 */
export const iconToEmoji = (icon) => {
  if (!icon) return '📦';

  // Si ya es un emoji (detectar por rango Unicode), devolverlo tal cual
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]/u;
  if (emojiRegex.test(icon)) {
    return icon;
  }

  // Si es un nombre de ícono, buscar en el mapeo (insensible a mayúsculas)
  const normalizedIcon = icon.toLowerCase().trim().replace(/\s+/g, '_');
  return ICON_NAME_TO_EMOJI[normalizedIcon] || ICON_NAME_TO_EMOJI.default;
};

/**
 * Transforma un array de categorías para convertir los íconos a emojis
 *
 * @param {Array} categories - Array de categorías con campo icon
 * @returns {Array} Categorías con íconos convertidos a emojis
 */
export const transformCategoriesIcons = (categories) => {
  if (!Array.isArray(categories)) return [];

  return categories.map(category => ({
    ...category,
    icon: iconToEmoji(category.icon)
  }));
};

export default {
  iconToEmoji,
  transformCategoriesIcons,
  ICON_NAME_TO_EMOJI
};
