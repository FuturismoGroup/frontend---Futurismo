import React, { useState, useEffect } from 'react';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  MapPinIcon,
  AcademicCapIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  PlusIcon,
  XMarkIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { USER_STATUS, GUIDE_TYPES } from '../../constants/usersConstants';
import { GUIDE_SPECIALTIES, EXPERTISE_LEVELS } from '../../constants/guidesConstants';
import { LANGUAGE_OPTIONS } from '../../config/languages';

const UserBasicInfoForm = ({
  register,
  errors,
  watch,
  setValue,
  roles,
  isEdit,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword
}) => {
  const { t } = useTranslation();

  // Observar el rol seleccionado para ocultar estado si es agencia
  const selectedRole = watch('role');
  const selectedGuideType = watch('guideType');

  // Estados para Freelance
  const [selectedLanguages, setSelectedLanguages] = useState(watch('languages') || []);
  const [selectedSpecialties, setSelectedSpecialties] = useState(watch('specialties') || []);
  const [museums, setMuseums] = useState(watch('museums') || []);

  // Observar valores del formulario para sincronizar estados locales
  const watchedLanguages = watch('languages');
  const watchedSpecialties = watch('specialties');
  const watchedMuseums = watch('museums');

  // FIX-F01: Sincronizar estados locales cuando cambian los valores del formulario (modo edición)
  useEffect(() => {
    if (Array.isArray(watchedLanguages) && watchedLanguages.length > 0) {
      setSelectedLanguages(watchedLanguages);
    }
  }, [watchedLanguages]);

  useEffect(() => {
    if (Array.isArray(watchedSpecialties) && watchedSpecialties.length > 0) {
      setSelectedSpecialties(watchedSpecialties);
    }
  }, [watchedSpecialties]);

  useEffect(() => {
    if (Array.isArray(watchedMuseums) && watchedMuseums.length > 0) {
      setMuseums(watchedMuseums);
    }
  }, [watchedMuseums]);

  // Handlers para idiomas
  const handleLanguageToggle = (language) => {
    const updated = selectedLanguages.includes(language)
      ? selectedLanguages.filter(l => l !== language)
      : [...selectedLanguages, language];
    setSelectedLanguages(updated);
    setValue('languages', updated);
  };

  // Handlers para especialidades
  const handleSpecialtyToggle = (specialty) => {
    const updated = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter(s => s !== specialty)
      : [...selectedSpecialties, specialty];
    setSelectedSpecialties(updated);
    setValue('specialties', updated);
  };

  // Handlers para museos
  const addMuseum = () => {
    const updated = [...museums, { name: '', years: 1, expertise: EXPERTISE_LEVELS[0].value }];
    setMuseums(updated);
    setValue('museums', updated);
  };

  const removeMuseum = (index) => {
    const updated = museums.filter((_, i) => i !== index);
    setMuseums(updated);
    setValue('museums', updated);
  };

  const updateMuseum = (index, field, value) => {
    const updated = museums.map((m, i) =>
      i === index ? { ...m, [field]: value } : m
    );
    setMuseums(updated);
    setValue('museums', updated);
  };

  return (
    <div className="space-y-6">
      {/* Sección: Información de Cuenta */}
      <div className="bg-gradient-to-br from-blue-50 to-white p-4 sm:p-5 rounded-xl border border-blue-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {t('users.form.accountInfo')}
          </h3>
          {selectedRole === 'agency' && (
            <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              {t('users.form.alwaysActive')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('users.form.username')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                {...register('username')}
                disabled={isEdit}
                className={`pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow ${
                  isEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                } ${
                  errors.username ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder={t('users.form.placeholders.username')}
              />
            </div>
            {isEdit && (
              <p className="mt-1 text-xs text-gray-500">
                {t('users.form.usernameNotEditable')}
              </p>
            )}
            {errors.username && (
              <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                <span className="text-red-500 font-bold">!</span>
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('users.form.email')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                {...register('email')}
                className={`pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow ${
                  errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder={t('users.form.placeholders.email')}
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                <span className="text-red-500 font-bold">!</span>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('users.form.role')} <span className="text-red-500">*</span>
            </label>
            <select
              {...register('role')}
              disabled={isEdit}
              className={`px-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow ${
                isEdit ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
              } ${
                errors.role ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">{t('users.form.selectRole')}</option>
              {roles.map(role => (
                <option key={role.id} value={role.name}>
                  {role.name} - {role.description}
                </option>
              ))}
            </select>
            {isEdit && (
              <p className="mt-1 text-xs text-gray-500">
                {t('users.form.roleNotEditable')}
              </p>
            )}
            {errors.role && (
              <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                <span className="text-red-500 font-bold">!</span>
                {errors.role.message}
              </p>
            )}
          </div>

          {/* Status - Oculto para agencias */}
          {selectedRole !== 'agency' && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('users.form.status')} <span className="text-red-500">*</span>
              </label>
              <select
                {...register('status')}
                className={`px-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow ${
                  errors.status ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value={USER_STATUS.ACTIVE}>{t('users.status.active')}</option>
                <option value={USER_STATUS.INACTIVE}>{t('users.status.inactive')}</option>
              </select>
              {errors.status && (
                <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                  <span className="text-red-500 font-bold">!</span>
                  {errors.status.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sección: Datos Personales */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            {t('users.form.personalData')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('users.form.firstName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('firstName')}
              className={`px-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow ${
                errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={t('users.form.placeholders.firstName')}
            />
            {errors.firstName && (
              <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                <span className="text-red-500 font-bold">!</span>
                {errors.firstName.message}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('users.form.lastName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('lastName')}
              className={`px-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow ${
                errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={t('users.form.placeholders.lastName')}
            />
            {errors.lastName && (
              <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                <span className="text-red-500 font-bold">!</span>
                {errors.lastName.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('users.form.phone')} <span className="text-red-500">*</span>
            </label>
            <div className="relative max-w-md">
              <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                {...register('phone')}
                className={`pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow ${
                  errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder={t('users.form.placeholders.phone')}
                maxLength={9}
                onInput={(e) => {
                  e.target.value = e.target.value.replace(/[^0-9]/g, '');
                }}
              />
            </div>
            {errors.phone && (
              <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                <span className="text-red-500 font-bold">!</span>
                {errors.phone.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sección: Seguridad - Solo en modo creación (backend no acepta password en PUT /users/:id) */}
      {!isEdit && (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-amber-600 rounded-full"></div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {t('users.form.security')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('users.form.password')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`pl-10 pr-10 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={t('users.form.placeholders.password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                  <span className="text-red-500 font-bold">!</span>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('users.form.confirmPassword')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <KeyIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  className={`pl-10 pr-10 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow ${
                    errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={t('users.form.placeholders.password')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-4 w-4" />
                  ) : (
                    <EyeIcon className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                  <span className="text-red-500 font-bold">!</span>
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sección Condicional: Información de Agencia */}
      {selectedRole === 'agency' && (
        <div className="bg-gradient-to-br from-green-50 to-white p-4 sm:p-5 rounded-xl border border-green-200 shadow-sm animate-fade-in-scale">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-green-600 rounded-full"></div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {t('users.form.agencyInfo')}
            </h3>
            <BuildingOfficeIcon className="h-5 w-5 text-green-600 ml-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('users.form.businessName')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  {...register('businessName')}
                  className={`pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-shadow ${
                    errors.businessName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder={t('users.form.placeholders.companyName')}
                />
              </div>
              {errors.businessName && (
                <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                  <span className="text-red-500 font-bold">!</span>
                  {errors.businessName.message}
                </p>
              )}
            </div>

            {/* RUC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('users.form.ruc')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  {...register('ruc')}
                  className={`pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-shadow ${
                    errors.ruc ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="20123456789"
                  maxLength={11}
                  inputMode="numeric"
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{t('users.form.rucHint')}</p>
              {errors.ruc && (
                <p className="mt-1 text-xs text-red-600 flex items-start gap-1">
                  <span className="text-red-500 font-bold">!</span>
                  {errors.ruc.message}
                </p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('users.form.address')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('address')}
                className={`px-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-shadow ${
                  errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder={t('users.form.placeholders.address')}
              />
              {errors.address && (
                <p className="mt-1.5 text-xs text-red-600 flex items-start gap-1">
                  <span className="text-red-500 font-bold">!</span>
                  {errors.address.message}
                </p>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Sección Condicional: Información de Guía */}
      {selectedRole === 'guide' && (
        <div className="bg-gradient-to-br from-purple-50 to-white p-4 sm:p-5 rounded-xl border border-purple-200 shadow-sm animate-fade-in-scale">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-purple-600 rounded-full"></div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              {t('users.form.guideInfo')}
            </h3>
            <MapPinIcon className="h-5 w-5 text-purple-600 ml-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tipo de Guía */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('users.form.guideType')} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción Planta */}
                <label
                  className={`relative flex items-start p-4 border-2 rounded-lg transition-all ${
                    isEdit ? 'pointer-events-none opacity-60' : 'cursor-pointer'
                  } ${
                    selectedGuideType === GUIDE_TYPES.PLANT
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    {...register('guideType')}
                    value={GUIDE_TYPES.PLANT}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <BuildingOfficeIcon className={`h-5 w-5 ${selectedGuideType === GUIDE_TYPES.PLANT ? 'text-purple-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${selectedGuideType === GUIDE_TYPES.PLANT ? 'text-purple-700' : 'text-gray-700'}`}>
                        {t('users.form.guidePlant')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('users.form.guidePlantDesc')}
                    </p>
                  </div>
                  {selectedGuideType === GUIDE_TYPES.PLANT && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </label>

                {/* Opción Freelance */}
                <label
                  className={`relative flex items-start p-4 border-2 rounded-lg transition-all ${
                    isEdit ? 'pointer-events-none opacity-60' : 'cursor-pointer'
                  } ${
                    selectedGuideType === GUIDE_TYPES.FREELANCE
                      ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-200'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                  }`}
                >
                  <input
                    type="radio"
                    {...register('guideType')}
                    value={GUIDE_TYPES.FREELANCE}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <UserIcon className={`h-5 w-5 ${selectedGuideType === GUIDE_TYPES.FREELANCE ? 'text-orange-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${selectedGuideType === GUIDE_TYPES.FREELANCE ? 'text-orange-700' : 'text-gray-700'}`}>
                        {t('users.form.guideFreelance')}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {t('users.form.guideFreelanceDesc')}
                    </p>
                  </div>
                  {selectedGuideType === GUIDE_TYPES.FREELANCE && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </label>
              </div>
              {isEdit && (
                <p className="mt-2 text-xs text-gray-500">
                  {t('users.form.guideTypeNotEditable')}
                </p>
              )}
              {errors.guideType && (
                <p className="mt-2 text-xs text-red-600 flex items-start gap-1">
                  <span className="text-red-500 font-bold">!</span>
                  {errors.guideType.message}
                </p>
              )}
            </div>

            {/* Número de Licencia - solo para Planta */}
            {selectedGuideType === GUIDE_TYPES.PLANT && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('users.form.licenseNumberOptional')}
                </label>
                <div className="relative max-w-md">
                  <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    {...register('licenseNumber')}
                    className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-shadow"
                    placeholder={t('users.form.licenseExample')}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">{t('users.form.licenseHint')}</p>
              </div>
            )}

            {/* Campos adicionales solo para Freelance */}
            {selectedGuideType === GUIDE_TYPES.FREELANCE && (
              <>
                {/* Años de Experiencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('users.form.yearsExperience')}
                  </label>
                  <div className="relative">
                    <AcademicCapIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      {...register('yearsOfExperience')}
                      className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-shadow"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                {/* DNI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('users.form.dni')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      {...register('dni')}
                      maxLength={8}
                      inputMode="numeric"
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const numbersOnly = pastedText.replace(/\D/g, '').slice(0, 8);
                        setValue('dni', numbersOnly);
                      }}
                      onChange={(e) => {
                        const numbersOnly = e.target.value.replace(/\D/g, '');
                        setValue('dni', numbersOnly);
                      }}
                      className={`pl-10 pr-4 py-2.5 w-full border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-shadow ${
                        errors.dni ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="12345678"
                    />
                  </div>
                  {errors.dni ? (
                    <p className="mt-1 text-xs text-red-500">{errors.dni.message}</p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">{t('users.form.dniHint')}</p>
                  )}
                </div>

                {/* Ciudad */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('users.form.city')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      {...register('city')}
                      className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-shadow"
                      placeholder="Lima, Perú"
                    />
                  </div>
                </div>

                {/* Número de Licencia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {t('users.form.licenseNumber')}
                  </label>
                  <div className="relative">
                    <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      {...register('licenseNumber')}
                      className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-shadow"
                      placeholder={t('users.form.licenseExample')}
                    />
                  </div>
                </div>

              </>
            )}

            {/* Idiomas - solo para Freelance */}
            {selectedGuideType === GUIDE_TYPES.FREELANCE && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <GlobeAltIcon className="inline h-4 w-4 mr-1" />
                  {t('users.form.languagesLabel')}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {LANGUAGE_OPTIONS.map((lang) => (
                    <label
                      key={lang.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedLanguages.includes(lang.value)
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLanguages.includes(lang.value)}
                        onChange={() => handleLanguageToggle(lang.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{lang.labelKey ? t(lang.labelKey) : lang.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Especialidades - solo para Freelance */}
            {selectedGuideType === GUIDE_TYPES.FREELANCE && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.form.specialtiesLabel')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {GUIDE_SPECIALTIES.map((spec) => (
                    <label
                      key={spec.value}
                      className={`flex items-center justify-center text-center px-2 py-2 border rounded-lg cursor-pointer transition-colors min-w-0 ${
                        selectedSpecialties.includes(spec.value)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSpecialties.includes(spec.value)}
                        onChange={() => handleSpecialtyToggle(spec.value)}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium truncate">{spec.labelKey ? t(spec.labelKey) : spec.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Experiencia en Museos - solo para Freelance */}
            {selectedGuideType === GUIDE_TYPES.FREELANCE && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('users.form.museumExperience')}
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  {t('users.form.museumExperienceHint')}
                </p>

                {/* Lista de museos agregados */}
                {museums.length > 0 && (
                  <div className="space-y-3 mb-4">
                    {museums.map((museum, index) => (
                      <div key={index} className="border border-orange-200 rounded-lg bg-orange-50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium text-orange-700 text-sm">{t('users.form.museumNumber', { number: index + 1 })}</span>
                          <button
                            type="button"
                            onClick={() => removeMuseum(index)}
                            className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {t('users.form.museumName')} *
                            </label>
                            <input
                              type="text"
                              value={museum.name || ''}
                              onChange={(e) => updateMuseum(index, 'name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder={t('users.form.museumNamePlaceholder')}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {t('users.form.museumYears')}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={museum.years || ''}
                              onChange={(e) => updateMuseum(index, 'years', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="5"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              {t('users.form.expertiseLevel')}
                            </label>
                            <select
                              value={museum.expertise || EXPERTISE_LEVELS[0].value}
                              onChange={(e) => updateMuseum(index, 'expertise', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              {EXPERTISE_LEVELS.map((level) => (
                                <option key={level.value} value={level.value}>
                                  {t(level.translationKey)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón para agregar museo */}
                <button
                  type="button"
                  onClick={addMuseum}
                  className="w-full border-2 border-dashed border-orange-300 rounded-lg py-3 px-4 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-colors flex items-center justify-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  {t('users.form.addMuseum')}
                </button>
              </div>
            )}

            {/* Biografía - solo para Freelance */}
            {selectedGuideType === GUIDE_TYPES.FREELANCE && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t('users.form.bio')}
                </label>
                <textarea
                  {...register('bio')}
                  rows={3}
                  className="px-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm transition-shadow resize-none"
                  placeholder={t('users.form.bioPlaceholder')}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserBasicInfoForm;