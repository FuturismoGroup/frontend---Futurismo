import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MapPinIcon, UserGroupIcon, CheckIcon, ChevronRightIcon, ChevronLeftIcon, PlusIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useReservationsStore } from '../../stores/reservationsStore';
import { formatters, canBookDirectly, generateWhatsAppURL } from '../../utils/formatters';
import { validators } from '../../utils/validators';
import WhatsAppConsultButton from './WhatsAppConsultButton';
import toast from 'react-hot-toast';
import useToursStore from '../../stores/toursStore';
import useAuthStore from '../../stores/authStore';
import { api } from '../../services';

// Tour types constants
const TOUR_TYPES = {
  REGULAR: 'regular',
  FULLDAY: 'fullday'
};

// Constantes locales del formulario (no dependen de backend)
const FORM_STEPS = {
  SERVICE: 1,
  TOURISTS: 2,
  CONFIRMATION: 3,
  MIN_STEP: 1,
  MAX_STEP: 3
};

const SERVICE_TYPES = {
  HALFDAY: 'halfday',
  FULLDAY: 'fullday',
  MULTIDAY: 'multiday',
  CUSTOM: 'custom'
};

const MAX_PERSONS_PER_GROUP = 50;

// Componentes del wizard
import StepIndicator from './wizard/StepIndicator';
import TourSelectionStep from './wizard/TourSelectionStep';
import PassengerInfoStep from './wizard/PassengerInfoStep';

// Esquemas de validación para cada paso (factory functions para i18n)
const getStep1Schema = (t) => yup.object({
  agencyId: yup.string().optional(),
  serviceType: yup.string().required(t('validation.serviceTypeRequired')),
  tourId: yup.string().required(t('validation.tourRequired')),
  date: yup.date().required(t('validation.dateRequired')).min(
    new Date(new Date().setHours(0, 0, 0, 0)),
    t('validation.datePast')
  ),
  time: yup.string().required(t('validation.timeRequired'))
});

const getStep2Schema = (t) => yup.object({
  pickupLocation: yup.string().required(t('validation.pickupRequired')),
  specialRequirements: yup.string(),
  groups: yup.array().of(
    yup.object({
      representativeName: yup.string().required(t('validation.representativeRequired')),
      representativePhone: yup.string()
        .required(t('validation.phoneRepRequired'))
        .test('phone-format', t('validation.phoneFormat'), value => {
          if (!value) return false;
          const digitsOnly = value.replace(/\s/g, '');
          return /^9\d{8}$/.test(digitsOnly);
        }),
      adultsCount: yup.number()
        .transform((value, originalValue) => {
          if (originalValue === '' || originalValue === null || originalValue === undefined) return 0;
          const parsed = Number(originalValue);
          return isNaN(parsed) ? 0 : parsed;
        })
        .required(t('validation.adultsRequired'))
        .min(0, t('validation.cannotBeNegative'))
        .max(MAX_PERSONS_PER_GROUP, t('validation.maxPersonsPerGroup', { max: MAX_PERSONS_PER_GROUP }))
        .integer(t('validation.mustBeInteger')),
      childrenCount: yup.number()
        .transform((value, originalValue) => {
          if (originalValue === '' || originalValue === null || originalValue === undefined) return 0;
          const parsed = Number(originalValue);
          return isNaN(parsed) ? 0 : parsed;
        })
        .min(0, t('validation.cannotBeNegative'))
        .max(MAX_PERSONS_PER_GROUP, t('validation.maxPersonsPerGroup', { max: MAX_PERSONS_PER_GROUP }))
        .integer(t('validation.mustBeInteger'))
        .default(0)
    })
  ).min(1, t('validation.minOneGroup'))
    .test('min-one-adult', t('validation.minOneAdult'), (groups) => {
      if (!groups || groups.length === 0) return false;
      const totalAdults = groups.reduce((sum, g) => sum + (parseInt(g.adultsCount) || 0), 0);
      return totalAdults >= 1;
    })
});

const getStep3Schema = (t) => yup.object({
  paymentMethod: yup.string().required(t('validation.paymentMethodRequired')),
  billingName: yup.string().required(t('validation.billingNameRequired')),
  billingDocument: yup.string().required(t('validation.documentRequired')),
  billingAddress: yup.string().required(t('validation.addressRequired')),
  acceptTerms: yup.boolean().oneOf([true], t('validation.mustAcceptTerms'))
});

const ReservationWizard = ({ onClose, onComplete }) => {
  const navigate = useNavigate();
  const { submitReservation } = useReservationsStore();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(FORM_STEPS.SERVICE);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFulldayTour, setIsFulldayTour] = useState(false);
  const [canBookDirectReservation, setCanBookDirectReservation] = useState(true);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [agencies, setAgencies] = useState([]);
  const [loadingAgencies, setLoadingAgencies] = useState(false);
  const [agencyBillingData, setAgencyBillingData] = useState(null);

  // Verificar si el usuario es admin
  const isAdmin = user?.role === 'admin' || user?.role === 'administrator';

  // Obtener tours del catálogo
  const { tours, loadTours, isLoading: toursLoading } = useToursStore();
  // Asegurar que availableTours sea siempre un array (solo tours activos)
  const availableTours = Array.isArray(tours) ? tours.filter(t => t.active !== false) : [];

  // Cargar tipos de servicio desde la API
  useEffect(() => {
    const loadServiceTypes = async () => {
      try {
        // Usar /api/services/types que permite admin y agency
        const response = await api.get('/services/types');

        if (response.data.success && response.data.data?.length > 0) {
          // Mapear al formato esperado
          setServiceTypes(response.data.data.map(t => ({
            value: t.code || t.id,
            label: t.name
          })));
        } else {
          // Fallback a tipos por defecto
          setServiceTypes([
            { value: 'city_tour', label: 'City Tour' },
            { value: 'walking', label: 'Walking Tour' },
            { value: 'food', label: 'Food Tour' },
            { value: 'adventure', label: 'Adventure' },
            { value: 'cultural', label: 'Cultural' },
            { value: 'night', label: 'Night Tour' }
          ]);
        }
      } catch (error) {
        console.error('Error loading service types:', error);
        // Fallback a tipos por defecto
        setServiceTypes([
          { value: 'city_tour', label: 'City Tour' },
          { value: 'walking', label: 'Walking Tour' },
          { value: 'food', label: 'Food Tour' },
          { value: 'adventure', label: 'Adventure' },
          { value: 'cultural', label: 'Cultural' },
          { value: 'night', label: 'Night Tour' }
        ]);
      } finally {
        setLoadingTypes(false);
      }
    };

    loadServiceTypes();
  }, []);

  // Cargar agencias (solo para admin)
  useEffect(() => {
    const loadAgencies = async () => {
      if (!isAdmin) return;

      try {
        setLoadingAgencies(true);
        const response = await api.get('/agencies');

        if (response.data.success && response.data.data) {
          // Filtrar solo agencias activas
          const activeAgencies = (response.data.data.agencies || response.data.data || [])
            .filter(a => a.status === 'active');
          setAgencies(activeAgencies);
        }
      } catch (error) {
        console.error('Error loading agencies:', error);
        setAgencies([]);
      } finally {
        setLoadingAgencies(false);
      }
    };

    loadAgencies();
  }, [isAdmin]);

  // Cargar catálogo de tours al montar el componente (cargar todos para selección)
  useEffect(() => {
    loadTours({ limit: 100, page: 1 }); // Cargar suficientes tours para el wizard
  }, [loadTours]);

  // Cargar datos de facturación de la agencia (para pre-llenar paso 3)
  useEffect(() => {
    const loadAgencyBilling = async () => {
      const agencyId = user?.agencyId;
      if (!agencyId) return;
      try {
        const response = await api.get(`/agencies/${agencyId}`);
        if (response.data.success && response.data.data) {
          const a = response.data.data;
          setAgencyBillingData({
            billingName: a.businessName || a.business_name || '',
            billingDocument: a.ruc || a.tax_id || '',
            billingAddress: a.agencyAddress || a.address || ''
          });
        }
      } catch (error) {
        console.error('Error loading agency billing data:', error);
      }
    };
    loadAgencyBilling();
  }, [user?.agencyId]);


  const steps = [
    { number: 1, title: t('reservations.wizard.service'), icon: MapPinIcon },
    { number: 2, title: t('reservations.wizard.details'), icon: UserGroupIcon },
    { number: 3, title: t('reservations.comp.stepConfirmation'), icon: CheckIcon }
  ];


  // Verificar si es tour fullday y horario de reserva
  useEffect(() => {
    if (formData.tourId) {
      const selectedTour = availableTours.find(t => t.id === formData.tourId);
      const isFullday = selectedTour?.type === 'fullday';
      setIsFulldayTour(isFullday);
      
      // Si es fullday, verificar horario para reserva directa
      if (isFullday) {
        const canBook = canBookDirectly();
        setCanBookDirectReservation(canBook);
      } else {
        setCanBookDirectReservation(true);
      }
    }
  }, [formData.tourId]);

  // Configuración de formularios para cada paso
  const getStepConfig = () => {
    switch (currentStep) {
      case 1:
        return {
          schema: getStep1Schema(t),
          defaultValues: {
            serviceType: formData.serviceType || 'tour',
            tourId: formData.tourId || '',
            date: formData.date || '',
            time: formData.time || '',
            agencyId: formData.agencyId || ''
          }
        };
      case 2:
        return {
          schema: getStep2Schema(t),
          defaultValues: {
            pickupLocation: formData.pickupLocation || '',
            specialRequirements: formData.specialRequirements || '',
            groups: formData.groups || [
              {
                representativeName: '',
                representativePhone: '',
                adultsCount: 1,
                childrenCount: 0
              }
            ]
          }
        };
      case 3:
        return {
          schema: getStep3Schema(t),
          defaultValues: {
            paymentMethod: formData.paymentMethod || 'transfer',
            billingName: formData.billingName || agencyBillingData?.billingName || '',
            billingDocument: formData.billingDocument || agencyBillingData?.billingDocument || '',
            billingAddress: formData.billingAddress || agencyBillingData?.billingAddress || '',
            acceptTerms: formData.acceptTerms || false
          }
        };
      default:
        return { schema: yup.object(), defaultValues: {} };
    }
  };

  const stepConfig = getStepConfig();
  const { register, handleSubmit, watch, control, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(stepConfig.schema),
    defaultValues: stepConfig.defaultValues
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "groups"
  });

  const selectedTour = watch('tourId');
  const selectedServiceType = watch('serviceType');
  const watchedGroups = watch('groups') || [];

  // Pre-llenar datos de facturación al entrar al paso 3
  useEffect(() => {
    if (currentStep === 3 && agencyBillingData) {
      // Solo pre-llenar si el usuario no los ha editado previamente
      if (!formData.billingName && agencyBillingData.billingName) {
        setValue('billingName', agencyBillingData.billingName);
      }
      if (!formData.billingDocument && agencyBillingData.billingDocument) {
        setValue('billingDocument', agencyBillingData.billingDocument);
      }
      if (!formData.billingAddress && agencyBillingData.billingAddress) {
        setValue('billingAddress', agencyBillingData.billingAddress);
      }
    }
  }, [currentStep, agencyBillingData, formData, setValue]);

  // Determinar el agencyId a usar para cargar métodos de pago
  const effectiveAgencyId = isAdmin ? watch('agencyId') : user?.agencyId;

  // Cargar métodos de pago desde la API de la agencia
  useEffect(() => {
    const loadPaymentMethods = async () => {
      if (!effectiveAgencyId) {
        // Sin agencia seleccionada: fallback genérico
        setPaymentMethods([
          { id: 'cash', name: 'Efectivo' },
          { id: 'bank_transfer', name: 'Transferencia Bancaria' },
          { id: 'yape', name: 'Yape' }
        ]);
        setLoadingPaymentMethods(false);
        return;
      }

      try {
        setLoadingPaymentMethods(true);
        const response = await api.get(`/agencies/${effectiveAgencyId}/payment-methods`);

        if (response.data.success && response.data.data && response.data.data.length > 0) {
          // Mapear métodos de la agencia: solo activos
          const activeMethods = response.data.data
            .filter(m => m.isActive !== false)
            .map(m => ({
              id: m.id,
              name: m.label || `${m.type}${m.bank ? ' - ' + m.bank : ''}${m.phoneNumber ? ' - ' + m.phoneNumber : ''}`
            }));
          setPaymentMethods(activeMethods.length > 0 ? activeMethods : [
            { id: 'cash', name: 'Efectivo' },
            { id: 'bank_transfer', name: 'Transferencia Bancaria' },
            { id: 'yape', name: 'Yape' }
          ]);
        } else {
          // Agencia sin métodos configurados: fallback genérico
          setPaymentMethods([
            { id: 'cash', name: 'Efectivo' },
            { id: 'bank_transfer', name: 'Transferencia Bancaria' },
            { id: 'yape', name: 'Yape' }
          ]);
        }
      } catch (error) {
        console.error('Error loading agency payment methods:', error);
        setPaymentMethods([
          { id: 'cash', name: 'Efectivo' },
          { id: 'bank_transfer', name: 'Transferencia Bancaria' },
          { id: 'yape', name: 'Yape' }
        ]);
      } finally {
        setLoadingPaymentMethods(false);
      }
    };

    loadPaymentMethods();
  }, [effectiveAgencyId]);

  // Filtrar tours según el tipo de servicio seleccionado
  const filteredTours = selectedServiceType
    ? availableTours.filter(tour => tour.category === selectedServiceType)
    : availableTours;

  const calculateTotal = () => {
    const tour = availableTours.find(t => t.id === (formData.tourId || selectedTour));
    if (!tour) return 0;
    // En paso 3 usamos formData.groups (ya guardado), en paso 2 calculamos desde watches individuales
    let totalAdults, totalChildren;
    if (formData.groups && formData.groups.length > 0) {
      totalAdults = formData.groups.reduce((sum, g) => sum + (parseInt(g.adultsCount) || 0), 0);
      totalChildren = formData.groups.reduce((sum, g) => sum + (parseInt(g.childrenCount) || 0), 0);
    } else {
      totalAdults = fields.reduce((sum, _f, i) => sum + (parseInt(watchedGroups?.[i]?.adultsCount) || 0), 0);
      totalChildren = fields.reduce((sum, _f, i) => sum + (parseInt(watchedGroups?.[i]?.childrenCount) || 0), 0);
    }
    const pricePerPerson = parseFloat(tour.price) || 0;
    const totalPersons = totalAdults + totalChildren;
    return totalPersons * pricePerPerson;
  };

  const handleNext = (data) => {
    setFormData({ ...formData, ...data });
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinalSubmit({ ...formData, ...data });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinalSubmit = async (finalData) => {
    setIsSubmitting(true);
    try {
      const selectedTourData = availableTours.find(t => t.id === finalData.tourId);

      // Validar que tengamos el usuario autenticado
      if (!user || !user.id) {
        toast.error(t('validation.mustLogin'));
        setIsSubmitting(false);
        return;
      }

      // Calcular cantidades desde grupos
      const groupsData = finalData.groups || [];
      const totalAdults = groupsData.reduce((sum, g) => sum + (parseInt(g.adultsCount) || 0), 0);
      const totalChildren = groupsData.reduce((sum, g) => sum + (parseInt(g.childrenCount) || 0), 0);

      // Obtener datos del primer grupo como cliente principal
      const primaryGroup = groupsData.length > 0 ? groupsData[0] : null;

      // Formatear fecha como YYYY-MM-DD para evitar problemas de timezone
      let formattedDate = finalData.date;
      if (finalData.date instanceof Date) {
        const year = finalData.date.getFullYear();
        const month = String(finalData.date.getMonth() + 1).padStart(2, '0');
        const day = String(finalData.date.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else if (typeof finalData.date === 'string' && finalData.date.includes('T')) {
        formattedDate = finalData.date.split('T')[0];
      }

      // Construir payload con grupos como fuente unica de verdad
      const reservation = {
        tourId: finalData.tourId,
        date: formattedDate,
        time: finalData.time,
        adults: totalAdults,
        children: totalChildren,
        // Grupos estructurados
        groups: groupsData.map(g => ({
          representativeName: g.representativeName,
          representativePhone: g.representativePhone,
          adultsCount: parseInt(g.adultsCount) || 0,
          childrenCount: parseInt(g.childrenCount) || 0
        })),
        pickupLocation: finalData.pickupLocation || '',
        specialRequirements: finalData.specialRequirements || '',
        clientName: primaryGroup?.representativeName || user.firstName + ' ' + (user.lastName || ''),
        clientPhone: primaryGroup?.representativePhone || user.phone || '',
        clientEmail: user.email || '',
        paymentMethod: finalData.paymentMethod,
        billingName: finalData.billingName,
        billingDocument: finalData.billingDocument,
        billingAddress: finalData.billingAddress,
        ...(finalData.agencyId && { agencyId: finalData.agencyId })
      };

      const result = await submitReservation(reservation);

      if (!result.success) {
        throw new Error(result.error || t('errors.unexpectedError'));
      }

      toast.success(t('reservations.reservationCreated'));

      // Llamar callback de completado si existe
      if (onComplete) {
        onComplete();
      }

      // Navegar a la página de confirmación o cerrar el wizard
      if (onClose) {
        onClose();
      } else {
        navigate('/reservations');
      }
    } catch (error) {
      // Mostrar el mensaje real del backend para que el usuario sepa qué corregir
      const backendMessage = error?.message || error?.response?.data?.message || error?.response?.data?.error;
      toast.error(backendMessage || t('errors.unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full h-full flex flex-col">
      {/* Progress indicator */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`
                  w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
                  ${currentStep >= step.number
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-110'
                    : 'bg-white text-gray-400 border-gray-300'}
                `}>
                  {currentStep > step.number ? (
                    <CheckIcon className="w-5 h-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <span className={`mt-2 text-xs font-semibold text-center whitespace-nowrap ${
                  currentStep >= step.number ? 'text-blue-700' : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-20 h-1 mx-4 rounded-full transition-all duration-300 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form content */}
      <form onSubmit={handleSubmit(handleNext)} className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        {/* Step 1: Service Selection */}
        {currentStep === 1 && (
          <div className="space-y-5">

            {/* Selector de agencia - Solo visible para admin */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Agencia *
                  <span className="ml-2 text-xs font-normal text-blue-600">(Solo visible para administradores)</span>
                </label>
                {loadingAgencies ? (
                  <div className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Cargando agencias...
                  </div>
                ) : agencies.length === 0 ? (
                  <div className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 font-medium">
                      No hay agencias activas disponibles.
                    </p>
                  </div>
                ) : (
                  <select
                    {...register('agencyId')}
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium"
                  >
                    <option value="">Selecciona una agencia</option>
                    {agencies.map((agency) => (
                      <option key={agency.id} value={agency.id}>
                        {agency.businessName || agency.business_name} - {agency.ruc || t('reservations.comp.noRUC')}
                      </option>
                    ))}
                  </select>
                )}
                {errors.agencyId && (
                  <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.agencyId.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Tipo de Servicio *</label>
              {loadingTypes ? (
                <div className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Cargando tipos...
                </div>
              ) : (
                <select
                  {...register('serviceType')}
                  onChange={(e) => {
                    // Actualizar el valor del serviceType
                    setValue('serviceType', e.target.value);
                    // Resetear el tour seleccionado cuando cambie el tipo de servicio
                    setValue('tourId', '');
                  }}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium"
                >
                  <option value="">Selecciona un tipo</option>
                  {serviceTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              )}
              {errors.serviceType && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.serviceType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">Tour *</label>
              {toursLoading ? (
                <div className="flex items-center justify-center py-6 bg-gray-50 rounded-lg">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent"></div>
                  <span className="ml-3 text-gray-700 font-medium">Cargando tours...</span>
                </div>
              ) : !selectedServiceType ? (
                <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-medium">
                    Selecciona primero un tipo de servicio para ver los tours disponibles.
                  </p>
                </div>
              ) : filteredTours.length === 0 ? (
                <div className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 font-medium">
                    No hay tours disponibles para el tipo de servicio seleccionado.
                  </p>
                </div>
              ) : (
                <select
                  {...register('tourId')}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium"
                >
                  <option value="">Selecciona un tour ({filteredTours.length} disponibles)</option>
                  {filteredTours.map(tour => (
                    <option key={tour.id} value={tour.id}>
                      {tour.name} - S/. {tour.price}/persona
                    </option>
                  ))}
                </select>
              )}
              {errors.tourId && (
                <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.tourId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Fecha *</label>
                <input
                  type="date"
                  {...register('date')}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium"
                  min={new Date().toISOString().split('T')[0]}
                />
                {errors.date && (
                  <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.date.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Hora *</label>
                <input
                  type="time"
                  {...register('time')}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white text-gray-900 font-medium"
                />
                {errors.time && (
                  <p className="mt-1.5 text-sm text-red-600 font-medium">{errors.time.message}</p>
                )}
              </div>
            </div>

            {/* Alerta para tours fullday después de las 5 PM */}
            {isFulldayTour && !canBookDirectReservation && (
              <div className="border border-orange-300 bg-orange-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-orange-800 mb-2">
                      Reserva de Tour Full Day después de las 5 PM
                    </h4>
                    <p className="text-sm text-orange-700 mb-3">
                      Para tours full day después de las 5:00 PM, es necesario consultar disponibilidad 
                      antes de realizar la reserva.
                    </p>
                    <WhatsAppConsultButton 
                      message={`Hola, necesito consultar disponibilidad para el tour "${availableTours.find(t => t.id === selectedTour)?.name}" para la fecha ${watch('date')} a las ${watch('time')}`}
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Información para tours fullday antes de las 5 PM */}
            {isFulldayTour && canBookDirectReservation && (
              <div className="border border-green-300 bg-green-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <CheckIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-green-800 mb-1">
                      Tour Full Day - Reserva Directa Disponible
                    </h4>
                    <p className="text-sm text-green-700">
                      Puedes realizar tu reserva directamente hasta las 5:00 PM. 
                      Después de ese horario será necesario consultar disponibilidad.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Details - Grupos como fuente unica de verdad */}
        {currentStep === 2 && (
          <PassengerInfoStep
            register={register}
            errors={errors}
            watch={watch}
            fields={fields}
            append={append}
            remove={remove}
            setValue={setValue}
            selectedTour={availableTours.find(t => t.id === formData.tourId)}
          />
        )}

        {/* Step 3: Confirmation */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">{t('reservations.comp.stepConfirmation')}</h3>

            {/* Resumen de la reserva */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">{t('reservations.reservationSummary')}</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tour:</span>
                  <span className="font-medium">
                    {availableTours.find(t => t.id === formData.tourId)?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="font-medium">{formatters.formatDate(formData.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Hora:</span>
                  <span className="font-medium">{formData.time}</span>
                </div>
                {formData.groups && formData.groups.length > 0 && (() => {
                  const grps = formData.groups;
                  const sumAdults = grps.reduce((s, g) => s + (parseInt(g.adultsCount) || 0), 0);
                  const sumChildren = grps.reduce((s, g) => s + (parseInt(g.childrenCount) || 0), 0);
                  return (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pasajeros:</span>
                        <span className="font-medium">
                          {sumAdults} adultos{sumChildren > 0 && `, ${sumChildren} niños`}
                        </span>
                      </div>
                      <div className="border-t pt-2 pb-2">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Grupos:</span>
                          <span className="font-medium">{grps.length} grupo{grps.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-2">
                          {grps.map((group, index) => {
                            const gAdults = parseInt(group.adultsCount) || 0;
                            const gChildren = parseInt(group.childrenCount) || 0;
                            const totalPersons = gAdults + gChildren;
                            return (
                              <div key={index} className="text-xs bg-blue-50 p-2 rounded">
                                <p className="font-medium text-blue-900">
                                  Grupo #{index + 1}: {group.representativeName}
                                </p>
                                <p className="text-blue-700">
                                  Tel: {group.representativePhone} | {gAdults} adultos, {gChildren} niños ({totalPersons} persona{totalPersons !== 1 ? 's' : ''})
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  );
                })()}
                <div className="border-t pt-2 flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-primary-600">S/. {calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('reservations.selectPaymentMethod')} *</label>
              {loadingPaymentMethods ? (
                <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  Cargando métodos de pago...
                </div>
              ) : (
                <select
                  {...register('paymentMethod')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingPaymentMethods}
                >
                  <option value="">Seleccionar método de pago</option>
                  {paymentMethods.map((method) => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.paymentMethod && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4 text-gray-900">{t('reservations.billingName')}</h4>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('reservations.billingName')} *</label>
                  <input
                    type="text"
                    {...register('billingName')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('reservations.comp.billingNamePlaceholder')}
                  />
                  {errors.billingName && (
                    <p className="mt-1 text-sm text-red-600">{errors.billingName.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('reservations.billingDocument')} *</label>
                    <input
                      type="text"
                      {...register('billingDocument')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('reservations.comp.billingDocPlaceholder')}
                    />
                    {errors.billingDocument && (
                      <p className="mt-1 text-sm text-red-600">{errors.billingDocument.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('reservations.billingAddress')} *</label>
                    <input
                      type="text"
                      {...register('billingAddress')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('reservations.comp.billingAddressPlaceholder')}
                    />
                    {errors.billingAddress && (
                      <p className="mt-1 text-sm text-red-600">{errors.billingAddress.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  {...register('acceptTerms')}
                  className="mt-1"
                />
                <span className="text-sm text-gray-600">
                  {t('reservations.acceptTermsText')} {t('reservations.termsAndConditions')}
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-sm text-red-600">{errors.acceptTerms.message}</p>
              )}
            </div>

            {/* Información importante */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Información Importante:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>La reserva será confirmada una vez validado el pago</li>
                    <li>Recibirá un email con los detalles y voucher</li>
                    <li>Cancelación gratuita hasta 24 horas antes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        </div>
        {/* Navigation buttons */}
        <div className="flex-shrink-0 bg-gray-50 px-8 py-5 border-t border-gray-200 flex justify-between items-center">
          <button
            type="button"
            onClick={handleBack}
            className="flex items-center gap-2 px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:border-gray-400 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed font-semibold shadow-sm bg-white"
            disabled={currentStep === 1}
          >
            <ChevronLeftIcon className="w-4 h-4" />
            {t('common.back')}
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md"
            disabled={isSubmitting || (currentStep === 1 && isFulldayTour && !canBookDirectReservation)}
          >
            {currentStep === 3 ? (
              <>
                {isSubmitting ? t('reservations.comp.processing') : t('reservations.comp.confirmReservation')}
                <CheckIcon className="w-4 h-4" />
              </>
            ) : (
              <>
                {(currentStep === 1 && isFulldayTour && !canBookDirectReservation)
                  ? t('reservations.comp.consultWhatsApp')
                  : t('common.confirm')}
                <ChevronRightIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReservationWizard;