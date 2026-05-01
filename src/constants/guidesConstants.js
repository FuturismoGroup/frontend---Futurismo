/**
 * Constantes de guías
 * Idiomas centralizados en config/languages.js
 */

export const FORM_TABS = [
  { id: 'personal', labelKey: 'guides.formTabs.personalInfo' },
  { id: 'languages', labelKey: 'guides.formTabs.languages' },
  { id: 'museums', labelKey: 'guides.formTabs.museums' }
];

export const LEVEL_OPTIONS = [
  { value: 'basic', labelKey: 'guides.levelOptions.basic' },
  { value: 'intermediate', labelKey: 'guides.levelOptions.intermediate' },
  { value: 'advanced', labelKey: 'guides.levelOptions.advanced' },
  { value: 'native', labelKey: 'guides.levelOptions.native' }
];

export const GUIDE_TYPES = {
  planta: 'AGENCY',      // Guía de planta (empleado)
  freelance: 'FREELANCE' // Guía freelance (independiente)
};

export const GUIDE_STATUS = {
  active: 'active',
  inactive: 'inactive',
  suspended: 'suspended',
  onVacation: 'onVacation'
};

// Especialidades de guías
export const GUIDE_SPECIALTIES = [
  { value: 'history', labelKey: 'guides.specialties.historical' },
  { value: 'nature', labelKey: 'guides.specialties.nature' },
  { value: 'culture', labelKey: 'guides.specialties.cultural' },
  { value: 'adventure', labelKey: 'guides.specialties.adventure' },
  { value: 'gastronomy', labelKey: 'guides.specialties.gastronomy' },
  { value: 'city', labelKey: 'guides.specialties.city' },
  { value: 'photography', labelKey: 'guides.specialties.photography' },
  { value: 'religious', labelKey: 'guides.specialties.religious' }
];

// Level colors for UI badges
export const LEVEL_COLORS = {
  principiante: 'bg-blue-100 text-blue-800',
  basic: 'bg-blue-100 text-blue-800',
  basico: 'bg-blue-100 text-blue-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  intermedio: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-green-100 text-green-800',
  avanzado: 'bg-green-100 text-green-800',
  native: 'bg-purple-100 text-purple-800',
  nativo: 'bg-purple-100 text-purple-800',
  expert: 'bg-red-100 text-red-800',
  experto: 'bg-red-100 text-red-800'
};

// Niveles de expertise para experiencia en museos
export const EXPERTISE_LEVELS = [
  { value: 'basico', translationKey: 'guides.levels.basico' },
  { value: 'intermedio', translationKey: 'guides.levels.intermedio' },
  { value: 'avanzado', translationKey: 'guides.levels.avanzado' },
  { value: 'experto', translationKey: 'guides.levels.experto' }
];

// Common museums and tourist sites
export const COMMON_MUSEUMS = [
  { id: 'machu-picchu', name: 'Machu Picchu' },
  { id: 'museo-larco', name: 'Museo Larco' },
  { id: 'museo-oro', name: 'Museo de Oro' },
  { id: 'museo-nacion', name: 'Museo de la Nación' },
  { id: 'huaca-pucllana', name: 'Huaca Pucllana' },
  { id: 'centro-historico-lima', name: 'Centro Histórico de Lima' },
  { id: 'circuito-magico-agua', name: 'Circuito Mágico del Agua' },
  { id: 'sacsayhuaman', name: 'Sacsayhuamán' },
  { id: 'qorikancha', name: 'Qorikancha' },
  { id: 'valle-sagrado', name: 'Valle Sagrado' }
];

// Validation regex patterns
export const DNI_REGEX = /^\d{8}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^9\d{8}$/;

// Export default para compatibilidad
export default {
  FORM_TABS,
  LEVEL_OPTIONS,
  GUIDE_TYPES,
  GUIDE_STATUS,
  GUIDE_SPECIALTIES,
  EXPERTISE_LEVELS,
  LEVEL_COLORS,
  COMMON_MUSEUMS,
  DNI_REGEX,
  EMAIL_REGEX,
  PHONE_REGEX
};
