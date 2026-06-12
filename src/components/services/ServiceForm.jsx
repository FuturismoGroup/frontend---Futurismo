import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  GlobeAltIcon,
  CheckCircleIcon,
  PhotoIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import toursService from '../../services/toursService';
import toast from 'react-hot-toast';
import LanguageMultiSelect from '../common/LanguageMultiSelect';
import StopsManager from './StopsManager';
import { resolveFileUrl } from '../../utils/fileUrl';

// Esquema de validación - factory function para i18n
const getServiceSchema = (t) => yup.object({
  serviceType: yup
    .string()
    .required(t('validation.serviceTypeRequired')),
  title: yup
    .string()
    .required(t('validation.titleRequired'))
    .min(3, t('validation.minChars', { min: 3 })),
  destination: yup
    .string()
    .required(t('validation.required')),
  description: yup
    .string()
    .transform((value) => (value?.trim() === '' ? undefined : value))
    .notRequired()
    .max(500, t('validation.maxChars', { max: 500 })),
  duration: yup
    .number()
    .required(t('validation.durationRequired'))
    .min(1, t('validation.durationMin', { min: 1 }))
    .max(24, t('validation.durationMax', { max: 24 })),
  maxParticipants: yup
    .number()
    .required(t('validation.maxParticipantsRequired'))
    .min(1, t('validation.maxParticipantsMin', { min: 1 }))
    .max(50, t('validation.maxParticipantsMax', { max: 50 })),
  basePrice: yup
    .number()
    .required(t('validation.positiveNumber'))
    .min(0, t('validation.positiveNumber')),
  languages: yup
    .array()
    .of(yup.string())
    .min(1, t('validation.languagesMinOne'))
    .required(t('validation.languagesRequired')),
  stops: yup
    .array()
    .of(
      yup.object({
        name: yup.string().required(t('validation.nameRequired')),
        // El backend puede devolver duration/description como null (campos vacios en BD).
        // Sin .nullable() yup falla la validacion silenciosamente y el form no se envia.
        duration: yup
          .number()
          .transform((value, originalValue) =>
            originalValue === '' || originalValue === null ? null : value
          )
          .nullable()
          .min(0),
        description: yup.string().nullable()
      })
    )
    .nullable()
});

const ServiceForm = ({ service = null, onSubmit, onCancel, isLoading = false }) => {
  const { t } = useTranslation();
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  // Guardar la imagen original del servicio (ruta del servidor)
  const [originalImage, setOriginalImage] = useState(service?.image || null);
  // Para preview: puede ser blob URL (nueva imagen) o null si se eliminó
  const [imagePreview, setImagePreview] = useState(service?.image || null);
  const [uploadingImage, setUploadingImage] = useState(false);
  // Indica si el usuario eliminó la imagen intencionalmente
  const [imageRemoved, setImageRemoved] = useState(false);

  const isEdit = !!service;

  const serviceSchema = useMemo(() => getServiceSchema(t), [t]);

  // Cargar categorías de tours desde la API (tabla tour_categories)
  useEffect(() => {
    const loadTourCategories = async () => {
      try {
        const response = await toursService.getCategories();

        if (response.success && response.data?.length > 0) {
          setServiceTypes(response.data.map(cat => ({
            value: cat.code,
            label: cat.name
          })));
        } else {
          console.error('No se encontraron categorías de tours en la BD');
          setServiceTypes([]);
        }
      } catch (error) {
        console.error('Error loading tour categories:', error);
        toast.error(t('errors.unexpectedError'));
        setServiceTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    };

    loadTourCategories();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(serviceSchema),
    defaultValues: {
      // Información básica
      // Backend devuelve: category, name, meetingPoint -> Frontend usa: serviceType, title, destination
      serviceType: service?.category || service?.type || '',
      title: service?.name || service?.title || '',
      destination: service?.meetingPoint || service?.meeting_point || service?.destination || '',
      description: service?.description || '',

      // Detalles operativos
      // Backend devuelve: maxCapacity, price -> Frontend usa: maxParticipants, basePrice
      duration: service?.duration || 4,
      maxParticipants: service?.maxCapacity || service?.max_capacity || service?.maxParticipants || 10,
      basePrice: service?.price ? parseFloat(service.price).toFixed(2) : (service?.basePrice ? parseFloat(service.basePrice).toFixed(2) : '0.00'),

      // Requisitos
      // Backend devuelve: includesGuide, includesTransport
      languages: service?.languages || ['es'],
      requiresGuide: service?.includesGuide ?? service?.includes_guide ?? service?.requiresGuide ?? true,
      requiresTransport: service?.includesTransport ?? service?.includes_transport ?? service?.requiresTransport ?? true,

      // Paradas
      stops: service?.stops || [],

      // Comercial (includes, excludes, notes)
      // includes y excludes vienen como arrays desde el backend, convertir a texto
      includes: Array.isArray(service?.includes) ? service.includes.join('\n') : (service?.includes || ''),
      excludes: Array.isArray(service?.excludes) ? service.excludes.join('\n') : (service?.excludes || ''),
      notes: service?.notes || ''
    }
  });

  // Actualizar formulario cuando cambian los datos del servicio (importante para modo edición)
  useEffect(() => {
    if (service) {
      reset({
        serviceType: service.category || service.type || '',
        title: service.name || service.title || '',
        destination: service.meetingPoint || service.meeting_point || service.destination || '',
        description: service.description || '',
        duration: service.duration || 4,
        maxParticipants: service.maxCapacity || service.max_capacity || service.maxParticipants || 10,
        basePrice: service.price ? parseFloat(service.price).toFixed(2) : (service.basePrice ? parseFloat(service.basePrice).toFixed(2) : '0.00'),
        languages: service.languages || ['es'],
        requiresGuide: service.includesGuide ?? service.includes_guide ?? service.requiresGuide ?? true,
        requiresTransport: service.includesTransport ?? service.includes_transport ?? service.requiresTransport ?? true,
        stops: service.stops || [],
        includes: Array.isArray(service.includes) ? service.includes.join('\n') : (service.includes || ''),
        excludes: Array.isArray(service.excludes) ? service.excludes.join('\n') : (service.excludes || ''),
        notes: service.notes || ''
      });

      // Actualizar también la imagen original y preview
      setOriginalImage(service.image || null);
      setImagePreview(service.image || null);
      setImageRemoved(false);
    }
  }, [service, reset]);

  // Manejar selección de imagen
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('validation.fileTooLargeMax5MB'));
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(t('validation.imageOnlyFormats'));
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageRemoved(false);
    }
  };

  // Eliminar imagen
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageRemoved(true);
  };

  // Subir imagen al servidor
  const uploadImageToServer = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // La respuesta viene en response.data.data.url
    return response.data.data?.url || response.data.url || response.data.path;
  };

  // Si la validacion falla, react-hook-form NO ejecuta handleFormSubmit.
  // Sin este callback el usuario no recibia ningun feedback (boton "no hacia nada").
  const handleInvalidSubmit = (formErrors) => {
    console.warn('Validacion del formulario de servicio fallida:', formErrors);
    toast.error(t('validation.fixFormErrors'));
  };

  const handleFormSubmit = async (data) => {
    setSaving(true);
    try {
      // Determinar qué imagen enviar
      let imageUrl = null;

      if (imageFile) {
        // Hay una nueva imagen seleccionada, subirla
        setUploadingImage(true);
        try {
          imageUrl = await uploadImageToServer(imageFile);
        } catch (err) {
          console.error('Error uploading image:', err);
          toast.error(t('upload.uploadError'));
          setSaving(false);
          setUploadingImage(false);
          return;
        }
        setUploadingImage(false);
      } else if (imageRemoved) {
        // El usuario eliminó la imagen intencionalmente
        imageUrl = null;
      } else if (originalImage) {
        // Preservar la imagen original (no hubo cambios)
        imageUrl = originalImage;
      }

      // Mapeo de campos frontend -> API tours (API-010, API-011)
      const tourData = {
        name: data.title,
        description: data.description?.trim() ? data.description.trim() : null,
        category: data.serviceType,
        price: parseFloat(data.basePrice),
        duration: parseInt(data.duration),
        maxCapacity: parseInt(data.maxParticipants),
        meetingPoint: data.destination,
        languages: data.languages || [],
        includesGuide: data.requiresGuide !== false,
        includesTransport: data.requiresTransport !== false,
        image: imageUrl || null,
        stops: (data.stops || []).map((stop, index) => ({
          name: stop.name,
          description: stop.description || '',
          duration: stop.duration ? parseInt(stop.duration) : null,
          order: index + 1
        })),
        includes: data.includes
          ? data.includes.split('\n').map(item => item.trim()).filter(item => item.length > 0)
          : [],
        excludes: data.excludes
          ? data.excludes.split('\n').map(item => item.trim()).filter(item => item.length > 0)
          : [],
        notes: data.notes || null
      };

      let result;
      if (isEdit) {
        result = await toursService.updateTour(service.id, tourData);
      } else {
        result = await toursService.createTour(tourData);
      }

      if (result.success === false) {
        toast.error(result.error || result.message || t('errors.unexpectedError'));
        return;
      }

      toast.success(isEdit ? t('common.updateService') : t('common.createService'));

      if (onSubmit) {
        onSubmit(result.data || result);
      }
    } catch (error) {
      console.error('Error saving tour:', error);
      toast.error(error.message || t('errors.unexpectedError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEdit ? t('services.editService') : t('services.newService')}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit, handleInvalidSubmit)} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
        {/* Información Básica */}
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
            <div className="w-1 h-6 bg-blue-500 rounded mr-3"></div>
            {t('services.serviceDetails')}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('providers.services.typeLabel')}
              </label>
              {loadingTypes ? (
                <div className="px-4 py-2.5 w-full border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                  {t('providers.services.loadingTypes')}
                </div>
              ) : (
                <select
                  {...register('serviceType')}
                  className={`px-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.serviceType ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  disabled={loadingTypes}
                >
                  <option value="">{t('providers.services.selectType')}</option>
                  {serviceTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              )}
              {errors.serviceType && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠</span> {errors.serviceType.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('pdf.name')} *
              </label>
              <input
                type="text"
                {...register('title')}
                className={`px-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder={t('services.placeholders.title')}
              />
              {errors.title && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠</span> {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPinIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                {t('pdf.pickupPoint')} *
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  {...register('destination')}
                  className={`pl-11 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.destination ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder={t('services.placeholders.destination')}
                />
              </div>
              {errors.destination && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠</span> {errors.destination.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <GlobeAltIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                {t('pdf.languages')} *
              </label>
              <Controller
                name="languages"
                control={control}
                render={({ field }) => (
                  <LanguageMultiSelect
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.languages}
                    placeholder={t('services.placeholders.languages')}
                  />
                )}
              />
              {errors.languages && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠</span> {errors.languages.message}
                </p>
              )}
              <p className="mt-1.5 text-xs text-gray-500 italic">
                {t('pdf.languages')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CurrencyDollarIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                {t('reservations.pricePerPerson')} *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">S/.</span>
                <input
                  type="number"
                  step="0.01"
                  {...register('basePrice')}
                  className={`pl-12 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.basePrice ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.basePrice && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠</span> {errors.basePrice.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                {t('settings.tours.defaultDuration')} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  {...register('duration')}
                  min="1"
                  max="24"
                  className={`pl-4 pr-16 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.duration ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="4"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                  h
                </span>
              </div>
              {errors.duration && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠</span> {errors.duration.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UsersIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                {t('settings.tours.maxCapacity')} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  {...register('maxParticipants')}
                  min="1"
                  max="50"
                  className={`pl-4 pr-20 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.maxParticipants ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                  }`}
                  placeholder="10"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">
                  {t('pdf.people')}
                </span>
              </div>
              {errors.maxParticipants && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠</span> {errors.maxParticipants.message}
                </p>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                {t('providers.services.descriptionLabel')}
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className={`px-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder={t('services.placeholders.description')}
              />
              {errors.description && (
                <p className="mt-1.5 text-sm text-red-600 flex items-center">
                  <span className="mr-1">⚠</span> {errors.description.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Imagen del Servicio */}
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
            <div className="w-1 h-6 bg-cyan-500 rounded mr-3"></div>
            {t('upload.profilePhoto')}
          </h3>

          <div className="flex items-start gap-6">
            {/* Preview de imagen */}
            <div className="flex-shrink-0">
              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={resolveFileUrl(imagePreview)}
                    alt={t('upload.previewAlt')}
                    className="w-40 h-40 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-40 h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <PhotoIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
            </div>

            {/* Input de archivo */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PhotoIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                {t('upload.profilePhoto')}
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
              <p className="mt-2 text-xs text-gray-500">
                {t('upload.supportedFormats')}. {t('upload.maxSize')}
              </p>
              {uploadingImage && (
                <p className="mt-2 text-sm text-blue-600 flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('upload.uploading')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Itinerario de Paradas */}
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
            <div className="w-1 h-6 bg-green-500 rounded mr-3"></div>
            {t('monitoring.tour.itinerary')}
          </h3>

          <Controller
            name="stops"
            control={control}
            render={({ field }) => (
              <StopsManager
                stops={field.value}
                onChange={field.onChange}
                errors={errors.stops?.message}
              />
            )}
          />
        </div>

        {/* Información Comercial */}
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
            <div className="w-1 h-6 bg-purple-500 rounded mr-3"></div>
            {t('services.serviceDetails')}
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckCircleIcon className="inline w-4 h-4 mr-1 text-green-500" />
                {t('reservations.comp.tourIncludes', { defaultValue: 'Incluye' })}
              </label>
              <textarea
                {...register('includes')}
                rows={4}
                className="px-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white"
                placeholder={t('services.placeholders.includes')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <XMarkIcon className="inline w-4 h-4 mr-1 text-red-500" />
                {t('reservations.comp.tourExcludes', { defaultValue: 'No Incluye' })}
              </label>
              <textarea
                {...register('excludes')}
                rows={4}
                className="px-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white"
                placeholder={t('services.placeholders.excludes')}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="inline w-4 h-4 mr-1 text-gray-500" />
                {t('profile.comp.additionalNotes')}
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="px-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none bg-white"
                placeholder={t('services.placeholders.notes')}
              />
            </div>
          </div>
        </div>

              </div>
            </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors font-medium"
              disabled={isLoading || saving}
            >
              {t('common.cancel')}
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isLoading || saving}
            >
              {(isLoading || saving) ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5 mr-2" />
                  {isEdit ? t('common.updateService') : t('common.createService')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;