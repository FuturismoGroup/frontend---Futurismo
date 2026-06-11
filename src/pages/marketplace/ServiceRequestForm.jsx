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
import { resolveFileUrl } from '../../utils/fileUrl';

/**
 * Retorna la fecha minima permitida en formato YYYY-MM-DD (manana).
 */
const getMinDateString = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

/**
 * Schema de validacion.
 * groupSize siempre entre 1 y 50 (sin depender de pricing externo).
 */
const buildSchema = (t) => yup.object().shape({
  serviceDate: yup
    .string()
    .required(t('marketplace.requestForm.validation.dateRequired'))
    .test('is-future', t('marketplace.requestForm.validation.dateFuture'), (value) => {
      if (!value) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(value + 'T00:00:00');
      return selected > today;
    }),

  startTime: yup
    .string()
    .required(t('marketplace.requestForm.validation.startTimeRequired'))
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/, t('marketplace.requestForm.validation.invalidTime')),

  groupSize: yup
    .number()
    .typeError(t('marketplace.requestForm.validation.mustBeNumber'))
    .required(t('marketplace.requestForm.validation.groupSizeRequired'))
    .min(1, t('marketplace.requestForm.validation.minOnePerson'))
    .max(50, t('marketplace.requestForm.validation.maxFiftyPeople')),

  offeredTotalPrice: yup
    .number()
    .typeError(t('marketplace.requestForm.validation.mustBeNumber'))
    .required(t('marketplace.requestForm.validation.priceRequired'))
    .min(1, t('marketplace.requestForm.validation.minPrice')),

  location: yup
    .string()
    .required(t('marketplace.requestForm.validation.locationRequired'))
    .min(3, t('marketplace.requestForm.validation.minThreeChars')),

  languages: yup
    .array()
    .of(yup.string())
    .min(1, t('marketplace.requestForm.validation.selectLanguage')),

  message: yup
    .string()
    .max(1000, t('marketplace.requestForm.validation.maxThousandChars')),

  specialRequirements: yup
    .string()
    .max(500, t('marketplace.requestForm.validation.maxFiveHundredChars'))
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

  const schema = useMemo(() => buildSchema(t), [t]);

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
          toast.error(t('marketplace.requestForm.guideProfileNotFound'));
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
        toast.error(t('marketplace.requestForm.guideLoadError'));
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
      toast.error(t('marketplace.requestForm.guideNoRate'));
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
      toast.success(t('marketplace.messages.requestSuccess'));
      navigate('/marketplace/requests');
    } catch (error) {
      console.error('Error creating service request:', error);
      toast.error(error.message || t('marketplace.requestForm.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDERS ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text={t('marketplace.requestForm.loadingGuide')} />
      </div>
    );
  }

  if (!guide) {
    return null;
  }

  const guideName = guide.name
    || guide.fullName
    || `${guide.firstName || ''} ${guide.lastName || ''}`.trim()
    || t('marketplace.requestForm.fallbackGuide');
  const guidePhoto = guide.guidePhoto
    || guide.profile?.avatar
    || guide.profilePhoto
    || '/images/default-avatar.png';
  const guideRating = guide.rating ? parseFloat(guide.rating).toFixed(1) : '0.0';
  const guideReviewCount = guide.reviewsCount || guide.reviewCount || 0;
  const guideLanguages = guide.languages || [];

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8">

        {/* Header con info del guia y tarifa */}
        <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6 mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{t('marketplace.requestForm.title')}</h1>

          <div className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-100">
            <img
              src={resolveFileUrl(guidePhoto)}
              alt={guideName}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-purple-200 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">{guideName}</h3>
              <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600 mt-0.5">
                <span className="flex items-center gap-1 truncate">
                  {guideRating} ({t('marketplace.requestForm.reviewsCount', { count: guideReviewCount })})
                </span>
              </div>
            </div>
            {hasPricing && (
              <div className="text-right shrink-0">
                <span className="text-base sm:text-2xl font-bold text-purple-700 whitespace-nowrap">
                  S/ {pricePerPerson.toFixed(2)}
                </span>
                <p className="text-[10px] sm:text-xs text-gray-500">{t('marketplace.requestForm.perPerson')}</p>
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
                <h3 className="font-semibold text-red-800">{t('marketplace.requestForm.rateUnavailable')}</h3>
                <p className="text-sm text-red-700 mt-1">
                  {t('marketplace.requestForm.rateUnavailableDesc')}
                </p>
                <button
                  type="button"
                  onClick={() => navigate(`/marketplace/guide/${guideId}`)}
                  className="mt-3 text-sm font-medium text-purple-700 hover:text-purple-900 underline"
                >
                  {t('marketplace.requestForm.backToGuideProfile')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Formulario: solo visible si el guia tiene tarifa */}
        {hasPricing && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {/* Seccion 1: Cantidad de personas y precio */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserGroupIcon className="h-5 w-5 text-purple-600" />
                {t('marketplace.requestForm.peopleCount')}
              </h2>

              <div className="mb-4">
                <label htmlFor="groupSize" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('marketplace.requestForm.peopleRange')}
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{t('marketplace.requestForm.guideRefRate')}</p>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                  <span>{t('marketplace.requestForm.pricePerPerson')}</span>
                  <span>S/ {pricePerPerson.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>{t('marketplace.requestForm.peopleQuantity')}</span>
                  <span>x {parseInt(watchGroupSize, 10) || 0}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex items-center justify-between">
                  <span className="font-medium text-gray-700">{t('marketplace.requestForm.refTotal')}</span>
                  <span className="text-base font-semibold text-gray-600">
                    S/ {referencePrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Precio ofertado por la agencia */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <label htmlFor="offeredTotalPrice" className="block text-sm font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-4 w-4 text-purple-600" />
                  {t('marketplace.requestForm.yourOfferLabel')}
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
                  placeholder={t('marketplace.requestForm.offerPlaceholder')}
                />
                {errors.offeredTotalPrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.offeredTotalPrice.message}</p>
                )}
                <p className="mt-2 text-xs text-purple-700">
                  {t('marketplace.requestForm.offerHint')}
                </p>
              </div>
            </div>

            {/* Seccion 2: Fecha, hora y ubicacion */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-purple-600" />
                {t('marketplace.requestForm.dateAndPlace')}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Fecha */}
                <div>
                  <label htmlFor="serviceDate" className="block text-sm font-medium text-gray-700 mb-1">
                    <CalendarIcon className="inline h-4 w-4 mr-1 text-gray-400" />
                    {t('marketplace.requestForm.serviceDate')}
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
                      <span>{t('marketplace.requestForm.checkingAvailability')}</span>
                    </div>
                  )}
                  {!isCheckingDate && dateAvailability && dateAvailability.available && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-green-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>{t('marketplace.requestForm.availableOnDate')}</span>
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
                    {t('marketplace.requestForm.startTime')}
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
                  {t('marketplace.requestForm.meetingPoint')}
                </label>
                <input
                  id="location"
                  type="text"
                  {...register('location')}
                  placeholder={t('marketplace.requestForm.meetingPointPlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
            </div>

            {/* Seccion 3: Idiomas */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('marketplace.requestForm.requiredLanguages')}</h2>

              {guideLanguages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {guideLanguages.map((lang) => {
                    const langCode = typeof lang === 'string' ? lang : lang.code;
                    const langLabel = t(`languageNames.${langCode}`, { defaultValue: langCode.toUpperCase() });
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
                <p className="text-sm text-gray-500">{t('marketplace.requestForm.guideNoLanguages')}</p>
              )}
              {errors.languages && (
                <p className="mt-2 text-sm text-red-600">{errors.languages.message}</p>
              )}
            </div>

            {/* Seccion 4: Mensaje y requerimientos */}
            <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('marketplace.requestForm.additionalInfo')}</h2>

              <div className="space-y-4">
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('marketplace.requestForm.messageLabel')}
                  </label>
                  <textarea
                    id="message"
                    {...register('message')}
                    rows={3}
                    placeholder={t('marketplace.requestForm.messagePlaceholder')}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('marketplace.requestForm.specialReqLabel')}
                  </label>
                  <textarea
                    id="specialRequirements"
                    {...register('specialRequirements')}
                    rows={2}
                    placeholder={t('marketplace.requestForm.specialReqPlaceholder')}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                  {errors.specialRequirements && (
                    <p className="mt-1 text-sm text-red-600">{errors.specialRequirements.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Resumen final antes de enviar */}
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="h-5 w-5 text-purple-600 flex-shrink-0" />
                <h3 className="font-semibold text-sm sm:text-base text-purple-900">{t('marketplace.requestForm.offerSummary')}</h3>
              </div>
              <div className="text-xs sm:text-sm text-purple-800 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-600">{t('marketplace.requestForm.refRateLabel')}</span>
                  <span className="text-gray-600 whitespace-nowrap">S/ {referencePrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-purple-200">
                  <span className="font-semibold text-purple-900">{t('marketplace.requestForm.yourOffer')}</span>
                  <span className="font-bold text-base sm:text-lg text-purple-700 whitespace-nowrap">
                    S/ {parseFloat(watchOfferedPrice || 0).toFixed(2)}
                  </span>
                </div>
              </div>
              <p className="text-[10px] sm:text-xs text-purple-600 mt-2">
                {t('marketplace.requestForm.offerReviewNote')}
              </p>
            </div>

            {/* Botones de accion */}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 pb-4 sm:pb-8">
              <button
                type="button"
                onClick={() => navigate(`/marketplace/guide/${guideId}`)}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
              >
                {t('marketplace.requestForm.cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isCheckingDate || (dateAvailability && !dateAvailability.available)}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" showDefaultText={false} />
                    <span>{t('marketplace.requestForm.sending')}</span>
                  </>
                ) : (
                  t('marketplace.requestForm.submit')
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
