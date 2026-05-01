import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import useEmergencyStore from '../stores/emergencyStore';
import { getStorageKey } from '../config/app.config';

// Tipos de contacto por defecto (fallback) - labelKey pattern
const DEFAULT_CONTACT_TYPES = [
  { value: 'emergency', labelKey: 'emergency.defaultContactTypes.emergency' },
  { value: 'coordinator', labelKey: 'emergency.defaultContactTypes.coordinator' },
  { value: 'management', labelKey: 'emergency.defaultContactTypes.management' },
  { value: 'police', labelKey: 'emergency.defaultContactTypes.police' },
  { value: 'medical', labelKey: 'emergency.defaultContactTypes.medical' },
  { value: 'insurance', labelKey: 'emergency.defaultContactTypes.insurance' },
  { value: 'towing', labelKey: 'emergency.defaultContactTypes.towing' },
  { value: 'weather', labelKey: 'emergency.defaultContactTypes.weather' },
  { value: 'local', labelKey: 'emergency.defaultContactTypes.local' },
  { value: 'operations', labelKey: 'emergency.defaultContactTypes.operations' }
];

const PHONE_REGEX = /^9\d{8}$/;

const useProtocolEditor = (protocol, onSave) => {
  const [selectedIcon, setSelectedIcon] = useState('🚨');
  const [contactTypes, setContactTypes] = useState(DEFAULT_CONTACT_TYPES); // Iniciar con valores por defecto
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const { t } = useTranslation();
  const materials = useEmergencyStore((state) => state.materials);

  const iconOptions = [
    '🚨', '🚑', '⛈️', '🚗', '🔍', '📡', '🏥', '👮',
    '🚒', '⚠️', '📋', '🛡️', '📞', '💊', '🩹', '🔧'
  ];

  // Extraer categoryId - puede venir como string, como objeto con id, o como categoryId separado
  const getCategoryId = () => {
    if (!protocol) return '';
    // Si tiene categoryId directo, usarlo
    if (protocol.categoryId) return protocol.categoryId;
    // Si category es un string (ID), usarlo
    if (typeof protocol.category === 'string') return protocol.category;
    // Si category es un objeto con id, extraer el id
    if (protocol.category && typeof protocol.category === 'object') return protocol.category.id || '';
    return '';
  };

  // Extraer steps - pueden venir como array de strings o como array de objetos
  const getSteps = () => {
    if (!protocol) return [{ text: '' }];
    // Si tiene steps directamente (array de objetos del backend)
    if (protocol.steps && Array.isArray(protocol.steps)) {
      return protocol.steps.map(step => ({
        text: typeof step === 'string' ? step : (step.description || step.title || '')
      }));
    }
    // Si tiene content.steps (formato antiguo, array de strings)
    if (protocol.content?.steps && Array.isArray(protocol.content.steps)) {
      return protocol.content.steps.map(step => ({ text: step }));
    }
    return [{ text: '' }];
  };

  // Extraer contacts - pueden venir directamente o en content (formato antiguo)
  const getContacts = () => {
    if (!protocol) return [{ name: '', phone: '', type: 'emergency' }];
    // Nuevo formato: contacts directamente en el protocolo
    if (protocol.contacts && Array.isArray(protocol.contacts) && protocol.contacts.length > 0) {
      return protocol.contacts;
    }
    // Formato antiguo: content.contacts
    if (protocol.content?.contacts && Array.isArray(protocol.content.contacts) && protocol.content.contacts.length > 0) {
      return protocol.content.contacts;
    }
    return [{ name: '', phone: '', type: 'emergency' }];
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: protocol?.title || '',
      description: protocol?.description || '',
      category: getCategoryId(),
      priority: protocol?.priority || 'media',
      icon: protocol?.icon || '🚨',
      steps: getSteps(),
      contacts: getContacts()
    }
  });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep
  } = useFieldArray({
    control,
    name: 'steps'
  });

  const {
    fields: contactFields,
    append: appendContact,
    remove: removeContact
  } = useFieldArray({
    control,
    name: 'contacts'
  });

  const watchedIcon = watch('icon');
  const watchedPriority = watch('priority');

  useEffect(() => {
    setSelectedIcon(watchedIcon);
  }, [watchedIcon]);

  // Load selected materials when protocol changes or materials are loaded
  useEffect(() => {
    if (materials.length > 0) {
      // Nuevo formato: materialIds directamente en el protocolo
      if (protocol?.materialIds && Array.isArray(protocol.materialIds) && protocol.materialIds.length > 0) {
        const loadedMaterials = materials.filter(m =>
          protocol.materialIds.includes(m.id)
        );
        setSelectedMaterials(loadedMaterials);
        return;
      }
      // Formato antiguo: content.materials
      if (protocol?.content?.materials && Array.isArray(protocol.content.materials) && protocol.content.materials.length > 0) {
        if (typeof protocol.content.materials[0] === 'string') {
          const loadedMaterials = materials.filter(m =>
            protocol.content.materials.includes(m.id)
          );
          setSelectedMaterials(loadedMaterials);
        } else {
          setSelectedMaterials(protocol.content.materials);
        }
      }
    }
  }, [protocol, materials]);

  // Load contact types from API
  useEffect(() => {
    const loadContactTypes = async () => {
      try {
        // Obtener el token de autenticación
        const token = localStorage.getItem(getStorageKey('authToken')) ||
                      sessionStorage.getItem(getStorageKey('authToken'));

        if (!token) {
          // Sin token, usar valores por defecto
          console.log('No token available, using default contact types');
          return;
        }

        const response = await fetch('/api/emergency/contact-types', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          const types = result.data.map(type => ({
            value: type.id || type.value,
            label: type.name || type.label,
            icon: type.icon,
            color: type.color
          }));
          setContactTypes(types);
        }
        // Si no hay datos del API, mantener los valores por defecto
      } catch (error) {
        console.warn('Error loading contact types from API, using defaults:', error.message);
        // Mantener los valores por defecto que ya están establecidos
      }
    };
    loadContactTypes();
  }, []);

  const onSubmit = (data) => {
    // Transformar steps al formato que espera el backend
    const stepsForBackend = data.steps
      .map((step, index) => step.text?.trim())
      .filter(text => text && text.length > 0)
      .map((text, index) => ({
        stepNumber: index + 1,
        title: text.length > 50 ? text.substring(0, 50) : text,
        description: text,
        isCritical: false
      }));

    // Construir objeto con formato del backend
    const protocolData = {
      title: data.title,
      description: data.description || '',
      categoryId: data.category, // Backend espera 'categoryId', no 'category'
      steps: stepsForBackend,
      // Campos adicionales para almacenar en metadata (si el backend lo soporta)
      priority: data.priority,
      icon: data.icon,
      content: {
        contacts: data.contacts.filter(contact => contact.name && contact.phone),
        materials: selectedMaterials.map(material => material.id)
      }
    };

    onSave(protocolData);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta': return 'border-red-300 bg-red-50';
      case 'media': return 'border-yellow-300 bg-yellow-50';
      case 'baja': return 'border-green-300 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return {
    // Form handling
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    errors,
    onSubmit,

    // Field arrays
    stepFields,
    appendStep,
    removeStep,
    contactFields,
    appendContact,
    removeContact,

    // Materials
    selectedMaterials,
    setSelectedMaterials,

    // State
    selectedIcon,
    setSelectedIcon,

    // Options
    iconOptions,
    contactTypes,

    // Utilities
    getPriorityColor,
    watchedPriority
  };
};

export default useProtocolEditor;