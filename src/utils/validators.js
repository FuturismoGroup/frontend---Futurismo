import * as yup from 'yup';
import i18next from 'i18next';
import { LIMITS, REGEX_PATTERNS } from './constants';

// Factory function for login schema (accepts t for i18n)
export const getLoginSchema = (t) => yup.object().shape({
  email: yup
    .string()
    .email(t('validation.invalidEmail'))
    .required(t('validation.emailRequired')),
  password: yup
    .string()
    .min(6, t('validation.passwordMinSix'))
    .required(t('validation.passwordRequired')),
  remember: yup.boolean()
});

// Backward-compatible static export
export const loginSchema = getLoginSchema(i18next.t.bind(i18next));

// Factory function for freelance guide registration schema
export const getFreelanceGuideRegisterSchema = (t) => yup.object().shape({
  name: yup
    .string()
    .min(2, t('validation.nameMinTwo'))
    .test('has-last-name', t('validation.mustHaveLastName'), (val) => {
      if (!val) return false;
      return val.trim().split(/\s+/).length >= 2;
    })
    .required(t('validation.nameRequired')),
  email: yup
    .string()
    .email(t('validation.invalidEmail'))
    .required(t('validation.emailRequired')),
  password: yup
    .string()
    .min(8, t('validation.passwordMinEight'))
    .matches(/(?=.*[a-z])/, t('validation.lowercaseRequired'))
    .matches(/(?=.*[A-Z])/, t('validation.uppercaseRequired'))
    .matches(/(?=.*\d)/, t('validation.numberRequired'))
    .required(t('validation.passwordRequired')),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], t('validation.passwordsMismatch'))
    .required(t('validation.confirmPassword')),
  phone: yup
    .string()
    .matches(REGEX_PATTERNS.PHONE, t('validation.phoneFormat'))
    .required(t('validation.phoneRequired')),
  dni: yup
    .string()
    .matches(/^\d{8}$/, t('validation.dniFormat'))
    .required(t('validation.dniRequired')),
  city: yup
    .string()
    .required(t('validation.cityRequired')),
  languages: yup
    .array()
    .min(1, t('validation.languagesMinOne'))
    .required(t('validation.languagesRequired')),
  experience: yup
    .number()
    .min(0, t('validation.experienceNegative'))
    .max(50, t('validation.experienceMax'))
    .required(t('validation.experienceRequired')),
  specialties: yup
    .array()
    .min(1, t('validation.specialtiesMinOne'))
    .required(t('validation.specialtiesRequired')),
  museums: yup
    .array()
    .optional(),
  museumExperiences: yup
    .object()
    .optional(),
  acceptTerms: yup
    .boolean()
    .oneOf([true], t('validation.termsRequired'))
    .required(t('validation.termsRequired')),
  profileImage: yup
    .mixed()
    .nullable()
    .test('fileSize', t('validation.fileTooLarge'), value => {
      if (!value) return true;
      return value.size <= 5 * 1024 * 1024;
    })
    .test('fileType', t('validation.invalidImageFormat'), value => {
      if (!value) return true;
      return ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(value.type);
    })
});

// Backward-compatible static export
export const freelanceGuideRegisterSchema = getFreelanceGuideRegisterSchema(i18next.t.bind(i18next));

/**
 * Valida fechas de disponibilidad
 */
export const validateDateRange = (startDate, endDate) => {
  const t = i18next.t.bind(i18next);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    return { valid: false, error: t('validation.startDatePast') };
  }

  if (end < start) {
    return { valid: false, error: t('validation.endDateBeforeStart') };
  }

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 365) {
    return { valid: false, error: t('validation.dateRangeExceeded') };
  }

  return { valid: true };
};

// Funciones de validación básicas
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const cleanPhone = phone.replace(/[\s.-]/g, '');
  const phoneRegex = /^9\d{8}$/;
  return phoneRegex.test(cleanPhone);
};

export const validateRUC = (ruc) => {
  return /^\d{11}$/.test(ruc);
};

export const validateDNI = (dni) => {
  return /^\d{8}$/.test(dni);
};

export const validateName = (name) => {
  return name && name.length >= 2 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name);
};

export const validatePassword = (password) => {
  return password && password.length >= 6;
};

export const validateCreditCard = (number) => {
  const cleaned = number.replace(/\s/g, '');
  return /^\d{13,19}$/.test(cleaned);
};

export const validateRequiredField = (value) => {
  return value !== null && value !== undefined && value !== '';
};

export const validateMinLength = (value, min) => {
  return value && value.length >= min;
};

export const validateMaxLength = (value, max) => {
  return value && value.length <= max;
};

export const validateNumberRange = (value, min, max) => {
  const num = Number(value);
  return !isNaN(num) && num >= min && num <= max;
};

export const validateFutureDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate >= today;
};

// Exportar todos los validators agrupados
export const validators = {
  validateEmail,
  validatePhone,
  validateRUC,
  validateDNI,
  validateName,
  validatePassword,
  validateCreditCard,
  validateRequiredField,
  validateMinLength,
  validateMaxLength,
  validateNumberRange,
  validateFutureDate,
  validateDateRange
};
