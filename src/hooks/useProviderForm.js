import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { VALIDATION_MESSAGES, RATING_RANGE } from '../constants/providersConstants';

// Fallback values para evitar undefined
const MIN_RATING = RATING_RANGE?.MIN || 1;
const MAX_RATING = RATING_RANGE?.MAX || 5;

// Empty provider template for new providers
const getEmptyProvider = () => ({
  name: '',
  category: '',
  location: '',
  contact: {
    contactPerson: '',
    phone: '',
    email: '',
    address: ''
  },
  observations: '',
  rating: 3, // Valor por defecto 3 (rango 1-5)
  capacity: 1,
  services: [''],
  specialties: [],
  languages: []
});

// Helper para extraer valores de servicios (transforma objetos a strings)
// Prioriza serviceType (key de traducción) para servicios estáticos, ID para dinámicos
const extractServiceIds = (servicesData) => {
  if (!servicesData || servicesData.length === 0) return [''];
  // Si ya son strings (IDs o keys), retornar tal cual
  if (typeof servicesData[0] === 'string') return servicesData;
  // Si son objetos del backend, extraer:
  // - serviceType/service_type si existe (para servicios estáticos, usa el key de traducción)
  // - id si no tiene serviceType (para servicios dinámicos creados manualmente)
  return servicesData.map(s => {
    // Priorizar serviceType para que coincida con las opciones del selector de servicios estáticos
    if (s.serviceType && s.serviceType.includes('.')) return s.serviceType;
    if (s.service_type && s.service_type.includes('.')) return s.service_type;
    // Si no es un key de traducción, usar el ID
    return s.id || '';
  }).filter(Boolean);
};

const useProviderForm = (provider, onSave, onCancel) => {
  const { t } = useTranslation();

  const extractedServices = extractServiceIds(provider?.services);
  const [services, setServices] = useState(extractedServices);
  const [specialties, setSpecialties] = useState(provider?.specialties || []);
  const [languages, setLanguages] = useState(provider?.languages || []);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newLanguage, setNewLanguage] = useState('');

  // Schema with i18n validation messages
  const providerSchema = yup.object({
    name: yup.string().required(t(VALIDATION_MESSAGES.REQUIRED)),
    category: yup.string().required(t(VALIDATION_MESSAGES.REQUIRED)),
    location: yup.string().required(t(VALIDATION_MESSAGES.REQUIRED)),
    contact: yup.object({
      contactPerson: yup.string().required(t(VALIDATION_MESSAGES.REQUIRED)),
      phone: yup.string()
        .required(t(VALIDATION_MESSAGES.REQUIRED))
        .matches(/^9\d{8}$/, t('validation.phoneDigits')),
      email: yup.string()
        .email(t(VALIDATION_MESSAGES.INVALID_EMAIL))
        .required(t(VALIDATION_MESSAGES.REQUIRED)),
      address: yup.string().required(t(VALIDATION_MESSAGES.REQUIRED))
    }),
    observations: yup.string(),
    rating: yup.number()
      .transform((value, originalValue) => {
        // Si está vacío o es NaN, devolver el valor por defecto
        return originalValue === '' || isNaN(value) ? 3 : value;
      })
      .min(MIN_RATING, t(VALIDATION_MESSAGES.MIN_VALUE))
      .max(MAX_RATING, t(VALIDATION_MESSAGES.MAX_VALUE)),
    capacity: yup.number().positive(t(VALIDATION_MESSAGES.POSITIVE_NUMBER))
  });

  const defaultValues = provider || getEmptyProvider();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm({
    resolver: yupResolver(providerSchema),
    defaultValues,
    mode: 'onSubmit', // Solo validar al enviar
    reValidateMode: 'onChange' // Re-validar mientras escribe después del primer intento
  });

  useEffect(() => {
    if (provider) {
      setServices(extractServiceIds(provider.services));
      setSpecialties(provider.specialties || []);
      setLanguages(provider.languages || []);
    }
  }, [provider]);

  const handleAddService = () => {
    setServices([...services, '']);
  };

  const handleRemoveService = (index) => {
    if (services.length > 1) {
      setServices(services.filter((_, i) => i !== index));
    }
  };

  const handleServiceChange = (index, value) => {
    const newServices = [...services];
    newServices[index] = value;
    setServices(newServices);
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim()) {
      setSpecialties([...specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (index) => {
    setSpecialties(specialties.filter((_, i) => i !== index));
  };

  const handleAddLanguage = () => {
    if (newLanguage.trim()) {
      setLanguages([...languages, newLanguage.trim()]);
      setNewLanguage('');
    }
  };

  const handleRemoveLanguage = (index) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    const formData = {
      ...data,
      services: services.filter(s => s.trim()),
      specialties,
      languages
    };

    try {
      await onSave(formData);
      toast.success(t('providers.form.saveSuccess'));
    } catch (error) {
      console.error('Error guardando proveedor:', error);
      toast.error(error?.message || t('providers.form.saveError'));
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  return {
    register,
    handleSubmit,
    errors,
    setValue,
    watch,
    services,
    providerServices: provider?.services || [], // Servicios completos del proveedor (objetos)
    specialties,
    languages,
    newSpecialty,
    setNewSpecialty,
    newLanguage,
    setNewLanguage,
    handleAddService,
    handleRemoveService,
    handleServiceChange,
    handleAddSpecialty,
    handleRemoveSpecialty,
    handleAddLanguage,
    handleRemoveLanguage,
    onSubmit,
    handleCancel
  };
};

export default useProviderForm;