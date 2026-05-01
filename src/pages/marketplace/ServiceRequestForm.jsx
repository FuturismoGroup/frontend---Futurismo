import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import useMarketplaceStore from '../../stores/marketplaceStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

/**
 * Mapa de codigos de idioma a nombre legible.
 */
const LANGUAGE_LABELS = {
  es: 'Espanol',
  en: 'Ingles',
  fr: 'Frances',
  de: 'Aleman',
  it: 'Italiano',
  pt: 'Portugues',
  ja: 'Japones',
  ko: 'Coreano',
  zh: 'Chino',
  ru: 'Ruso'
};

/**
 * Retorna la fecha minima permitida en formato YYYY-MM-DD (manana).
 */
const getMinDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Schema de validacion estatico.
 * groupSize siempre entre 1 y 50 (sin depender de pricing externo).
 */
const schema = yup.object().shape({
  serviceDate: yup
    .string()
    .required('La fecha es requerida')
    .test('is-future', 'La fecha debe ser futura', (value) => {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(value + 'T00:00:00');
      return selected > today;
    }),

  startTime: yup
    .string()
    .required('La hora de inicio es requerida')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/, 'Formato de hora invalido (HH:MM)'),

  groupSize: yup
    .number()
    .typeError('Debe ser un numero')
    .required('La cantidad de personas es requerida')
    .min(1, 'Minimo 1 persona')
    .max(50, 'Maximo 50 personas'),

  offeredTotalPrice: yup
    .number()
    .typeError('Debe ser un numero')
    .required('El precio ofertado es requerido')
    .min(1, 'El precio minimo es S/ 1.00'),

  location: yup
    .string()
    .required('El punto de encuentro es requerido')
    .min(3, 'Minimo 3 caracteres'),

  languages: yup
    .array()
    .of(yup.string())
    .min(1, 'Seleccione al menos un idioma'),

  message: yup
    .string()
    .max(1000, 'Maximo 1000 caracteres'),

  specialRequirements: yup
    .string()
    .max(500, 'Maximo 500 caracteres')
});

const ServiceRequestForm = () => {
  const { guideId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { fetchGuideProfile, createServiceRequest, checkDateAvailability } = useMarketplaceStore();

  const [guide, setGuide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateAvailability, setDateAvailability] = useState(null);
  const [isCheckingDate, setIsCheckingDate] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      serviceDate: '',
      startTime: '',
      groupSize: 1,
      offeredTotalPrice: '',
      location: '',
      languages: [],
      message: '',
      specialRequirements: ''
    }
  });

  const watchGroupSize = watch('groupSize');
  const watchOfferedPrice = watch('offeredTotalPrice');
  const watchServiceDate = watch('serviceDate');

  // Tarifa del guia (solo lectura, referencial)
  const pricePerPerson = guide?.pricePerPerson ? parseFloat(guide.pricePerPerson) : null;
  const hasPricing = pricePerPerson !== null && pricePerPerson > 0;

  // Precio referencial calculado con tarifa del guia
  const referencePrice = useMemo(() => {
    if (!hasPricing || !watchGroupSize) return 0;
    const size = parseInt(watchGroupSize, 10);
    if (isNaN(size) || size < 1) return 0;
    return pricePerPerson * size;
  }, [hasPricing, pricePerPerson, watchGroupSize]);

  // Auto-actualizar precio ofertado cuando cambia el grupo y no se ha editado manualmente
  const [priceManuallyEdited, setPriceManuallyEdited] = useState(false);
  useEffect(() => {
    if (!priceManuallyEdited && referencePrice > 0) {
      setValue('offeredTotalPrice', parseFloat(referencePrice.toFixed(2)));
    }
  }, [referencePrice, priceManuallyEdited, setValue]);

  // Verificar disponibilidad del guía cuando cambia la fecha
  useEffect(() => {
    if (!watchServiceDate || !guideId) {
      setDateAvailability(null);
      return;
    }

    // Verificar que sea fecha futura válida
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(watchServiceDate + 'T00:00:00');
    if (selected <= today) {
      setDateAvailability(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    const checkAvailability = async () => {
      setIsCheckingDate(true);
      setDateAvailability(null);
      try {
        const result = await checkDateAvailability(guideId, watchServiceDate);
        if (!cancelled) {
          setDateAvailability(result);
        }
      } catch {
        if (!cancelled) {
          setDateAvailability(null);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingDate(false);
        }
      }
    };

    // Debounce de 400ms para evitar llamadas excesivas
    const timer = setTimeout(checkAvailability, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [watchServiceDate, guideId]);

  // Cargar perfil del guia
  useEffect(() => {
    const loadGuide = async () => {
      setIsLoading(true);
      try {
        const guideData = await fetchGuideProfile(guideId);

        if (!guideData) {
          toast.error('No se encontro el perfil del guia');
          navigate('/marketplace');
          return;
        }

        setGuide(guideData);

        // Pre-seleccionar primer idioma del guia si tiene
        if (guideData.languages && guideData.languages.length > 0) {
          const firstLang = typeof guideData.languages[0] === 'string'
            ? guideData.languages[0]
            : guideData.languages[0].code;
          setValue('languages', [firstLang]);
        }
      } catch (error) {
        console.error('Error loading guide data:', error);
        toast.error('Error al cargar los datos del guia');
        navigate('/marketplace');
      } finally {
        setIsLoading(false);
      }
    };

    if (guideId) {
      loadGuide();
    }
  }, [guideId]);

  const onSubmit = async (data) => {
    if (!hasPricing) {
      toast.error('El guia no tiene tarifa configurada');
      return;
    }

    if (dateAvailability && !dateAvailability.available) {
      toast.error(dateAvailability.message || t('marketplace.messages.guideNotAvailable'));
      return;
    }

    setIsSubmitting(true);
    try {
      const requestPayload = {
        guideId,
        serviceDate: data.serviceDate,
        startTime: data.startTime,
        groupSize: parseInt(data.groupSize, 10),
        offeredTotalPrice: parseFloat(data.offeredTotalPrice),
        location: data.location,
        languages: data.languages,
        message: data.message || '',
        specialRequirements: data.specialRequirements || ''
      };

      await createServiceRequest(requestPayload);
      toast.success('Solicitud enviada exitosamente');
      navigate('/marketplace/requests');
    } catch (error) {
      console.error('Error creating service request:', error);
      toast.error(error.message || 'Error al enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERS ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando datos del guia..." />
      </div>
    );
  }

  if (!guide) {
    return null;
  }

  const guideName = guide.name
    || guide.fullName
    || `${guide.firstName || ''} ${guide.lastName || ''}`.trim()
    || 'Guia';
  const guidePhoto = guide.guidePhoto
    || guide.profile?.avatar
    || guide.profilePhoto
    || '/images/default-avatar.png';
  const guideRating = guide.rating ? parseFloat(guide.rating).toFixed(1) : '0.0';
  const guideReviewCount = guide.reviewsCount || guide.reviewCount || 0;
  const guideLanguages = guide.languages || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header con info del guia y tarifa */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Solicitar Servicio</h1>

          <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg border border-purple-100">
            <img
              src={guidePhoto}
              alt={guideName}
              className="w-14 h-14 rounded-full object-cover border-2 border-purple-200"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{guideName}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-0.5">
                <span className="flex items-center gap-1">
                  {guideRating} ({guideReviewCount} resenas)
                </span>
              </div>
            </div>
            {hasPricing && (
              <div className="text-right shrink-0">
                <span className="text-2xl font-bold text-purple-700">
                  S/ {pricePerPerson.toFixed(2)}
                </span>
                <p className="text-xs text-gray-500">por persona</p>
              </div>
            )}
          </div>
        </div>

        {/* Mensaje de error si no tiene tarifa */}
        {!hasPricing && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Tarifa no disponible</h3>
                <p className="text-sm text-red-700 mt-1">
                  Este guia aun no tiene una tarifa por persona configurada.
                  No es posible enviar una solicitud hasta que el guia establezca su precio.
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/marketplace/guide/${guideId}`)}
                  className="mt-3 text-sm font-medium text-purple-700 hover:text-purple-900 underline"
                >
                  Volver al perfil del guia
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario: solo visible si el guia tiene tarifa */}
        {hasPricing && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Seccion 1: Cantidad de personas y precio */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-purple-600" />
                Cantidad de personas
              </h2>

              <div className="mb-4">
                <label htmlFor="groupSize" className="block text-sm font-medium text-gray-700 mb-1">
                  Personas (1 - 50)
                </label>
                <input
                  id="groupSize"
                  type="number"
                  {...register('groupSize')}
                  min={1}
                  max={50}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                {errors.groupSize && (
                  <p className="mt-1 text-sm text-red-600">{errors.groupSize.message}</p>
                )}
              </div>

              {/* Tarifa referencial del guia */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Tarifa referencial del guia</p>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>Precio por persona</span>
                  <span>S/ {pricePerPerson.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Cantidad de personas</span>
                  <span>x {parseInt(watchGroupSize, 10) || 0}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                  <span className="font-medium text-gray-700">Total referencial</span>
                  <span className="text-base font-semibold text-gray-600">
                    S/ {referencePrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Precio ofertado por la agencia */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <label htmlFor="offeredTotalPrice" className="block text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-4 w-4 text-purple-600" />
                  Tu oferta de precio total (S/)
                </label>
                <input
                  id="offeredTotalPrice"
                  type="number"
                  step="0.01"
                  min="1"
                  {...register('offeredTotalPrice')}
                  onChange={(e) => {
                    register('offeredTotalPrice').onChange(e);
                    setPriceManuallyEdited(true);
                  }}
                  className="w-full px-3 py-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg font-semibold text-purple-900 bg-white"
                  placeholder="Ingrese su oferta"
                />
                {errors.offeredTotalPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.offeredTotalPrice.message}</p>
                )}
                <p className="mt-2 text-xs text-purple-700">
                  Puede ofrecer un precio diferente al referencial. El guia decidira si acepta o rechaza su oferta.
                </p>
              </div>
            </div>

            {/* Seccion 2: Fecha, hora y ubicacion */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
                Fecha y lugar
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Fecha */}
                <div>
                  <label htmlFor="serviceDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="inline h-4 w-4 mr-1 text-gray-400" />
                    Fecha del servicio
                  </label>
                  <input
                    id="serviceDate"
                    type="date"
                    {...register('serviceDate')}
                    min={getMinDateString()}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {errors.serviceDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.serviceDate.message}</p>
                  )}
                  {/* Feedback de disponibilidad */}
                  {isCheckingDate && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                      <LoadingSpinner size="xs" showDefaultText={false} />
                      <span>Verificando disponibilidad...</span>
                    </div>
                  )}
                  {!isCheckingDate && dateAvailability && dateAvailability.available && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-green-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Disponible en esta fecha</span>
                    </div>
                  )}
                  {!isCheckingDate && dateAvailability && !dateAvailability.available && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      <ExclamationTriangleIcon className="h-4 w-4 shrink-0" />
                      <span>{dateAvailability.message || t('marketplace.messages.guideNotAvailable')}</span>
                    </div>
                  )}
                </div>

                {/* Hora */}
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                    <ClockIcon className="inline h-4 w-4 mr-1 text-gray-400" />
                    Hora de inicio
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    {...register('startTime')}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  {errors.startTime && (
                    <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                  )}
                </div>
              </div>

              {/* Ubicacion */}
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPinIcon className="inline h-4 w-4 mr-1 text-gray-400" />
                  Punto de encuentro
                </label>
                <input
                  id="location"
                  type="text"
                  {...register('location')}
                  placeholder="Ej: Plaza de Armas, Cusco"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
            </div>

            {/* Seccion 3: Idiomas */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Idiomas requeridos</h2>

              {guideLanguages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {guideLanguages.map((lang) => {
                    const langCode = typeof lang === 'string' ? lang : lang.code;
                    const langLabel = LANGUAGE_LABELS[langCode] || langCode.toUpperCase();
                    return (
                      <label
                        key={langCode}
                        className="flex items-center p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-200 transition-colors"
                      >
                        <input
                          type="checkbox"
                          value={langCode}
                          {...register('languages')}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{langLabel}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">El guia no tiene idiomas configurados.</p>
              )}
              {errors.languages && (
                <p className="mt-2 text-sm text-red-600">{errors.languages.message}</p>
              )}
            </div>

            {/* Seccion 4: Mensaje y requerimientos */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informacion adicional</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje para el guia (opcional)
                  </label>
                  <textarea
                    id="message"
                    {...register('message')}
                    rows={3}
                    placeholder="Describa brevemente lo que necesita, expectativas del grupo, etc."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                    Requerimientos especiales (opcional)
                  </label>
                  <textarea
                    id="specialRequirements"
                    {...register('specialRequirements')}
                    rows={2}
                    placeholder="Ej: Movilidad reducida, alergias alimentarias, necesidades especificas..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                  {errors.specialRequirements && (
                    <p className="mt-1 text-sm text-red-600">{errors.specialRequirements.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen final antes de enviar */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Resumen de la oferta</h3>
              </div>
              <div className="text-sm text-purple-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tarifa referencial:</span>
                  <span className="text-gray-600">S/ {referencePrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-purple-200">
                  <span className="font-semibold text-purple-900">Tu oferta:</span>
                  <span className="font-bold text-lg text-purple-700">
                    S/ {parseFloat(watchOfferedPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-purple-600 mt-2">
                El guia revisara tu oferta y decidira si la acepta o rechaza.
              </p>
            </div>

            {/* Botones de accion */}
            <div className="flex gap-4 pb-8">
              <button
                type="button"
                onClick={() => navigate(`/marketplace/guide/${guideId}`)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isCheckingDate || (dateAvailability && !dateAvailability.available)}
                className="flex-1 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" showDefaultText={false} />
                    <span>Enviando...</span>
                  </>
                ) : (
                  'Enviar solicitud'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ServiceRequestForm;
