import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, ArrowPathIcon, BuildingOffice2Icon, MapIcon, ShieldCheckIcon, UserPlusIcon, XMarkIcon, PlusIcon, ChevronDownIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';


import useAuthStore from '../stores/authStore';
import { loginSchema, freelanceGuideRegisterSchema } from '../utils/validators';
import ImageUpload from '../components/common/ImageUpload';
import LanguageToggle from '../components/common/LanguageToggle';
import TermsModal from '../components/common/TermsModal';
import { GUIDE_SPECIALTIES } from '../constants/guidesConstants';
import { LANGUAGE_OPTIONS } from '../config/languages';

const LoginRegister = () => {
  const navigate = useNavigate();
  const { login, register: registerUser, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [selectedMuseums, setSelectedMuseums] = useState([]);
  const [museumRatings, setMuseumRatings] = useState({});
  const [museumExperiences, setMuseumExperiences] = useState({});
  const [museumSearchTerm, setMuseumSearchTerm] = useState('');
  const [showMuseumDropdown, setShowMuseumDropdown] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(isRegistering ? freelanceGuideRegisterSchema : loginSchema),
    defaultValues: isRegistering ? {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dni: '',
      city: '',
      languages: [],
      experience: 0,
      specialties: [],
      museums: [],
      museumRatings: {},
      museumExperiences: {},
      acceptTerms: false,
      profileImage: null
    } : {
      email: '',
      password: '',
      remember: false
    }
  });

  // useEffect eliminado - ya no se usa dropdown de museos

  const onSubmit = async (data) => {
    try {
      if (isRegistering) {
        const registerData = {
          ...data,
          role: 'guide',
          guideType: 'freelance',
          languages: selectedLanguages,
          specialties: selectedSpecialties,
          museums: selectedMuseums,
          museumRatings: museumRatings,
          museumExperiences: museumExperiences,
          profileImage: profileImage
        };
        const result = await registerUser(registerData);

        if (result.success) {
          if (result.pendingApproval) {
            toast.success(result.message || 'Registro exitoso. Tu solicitud está pendiente de aprobación.');
            setIsRegistering(false);
            reset();
          } else {
            toast.success(t('auth.registerSuccess'));
            navigate('/dashboard');
          }
        } else {
          toast.error(result.error || t('auth.registerError'));
        }
      } else {
        const result = await login(data);
        
        if (result.success) {
          toast.success(t('auth.welcome'));
          navigate('/dashboard');
        } else {
          toast.error(result.error || t('auth.loginError'));
        }
      }
    } catch (error) {
      toast.error(t('auth.unexpectedError'));
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    reset();
    setShowPassword(false);
    setSelectedLanguages([]);
    setSelectedSpecialties([]);
    setSelectedMuseums([]);
    setMuseumRatings({});
    setMuseumExperiences({});
    setMuseumSearchTerm('');
    setShowMuseumDropdown(false);
    setProfileImage(null);
    setImageError(null);
  };

  // Usar constantes centralizadas de guidesConstants.js
  // Para agregar/quitar idiomas o especialidades, modificar guidesConstants.js
  const languageOptions = LANGUAGE_OPTIONS;
  const specialtyOptions = GUIDE_SPECIALTIES;


  const handleLanguageToggle = (language) => {
    const updatedLanguages = selectedLanguages.includes(language)
      ? selectedLanguages.filter(l => l !== language)
      : [...selectedLanguages, language];
    setSelectedLanguages(updatedLanguages);
    setValue('languages', updatedLanguages);
  };

  const handleSpecialtyToggle = (specialty) => {
    const updatedSpecialties = selectedSpecialties.includes(specialty)
      ? selectedSpecialties.filter(s => s !== specialty)
      : [...selectedSpecialties, specialty];
    setSelectedSpecialties(updatedSpecialties);
    setValue('specialties', updatedSpecialties);
  };



  const handleImageSelect = (file, error) => {
    if (error) {
      setImageError(error);
      setProfileImage(null);
      setValue('profileImage', null);
    } else {
      setImageError(null);
      setProfileImage(file);
      setValue('profileImage', file);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className={`w-full ${isRegistering ? 'max-w-5xl' : 'max-w-md'}`}>
        {/* Logo y título */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full mb-3 sm:mb-4">
            <span className="text-2xl sm:text-3xl text-white">🌎</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Futurismo</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">{t('auth.systemTitle')}</p>
        </div>

        {/* Selector de idioma */}
        <div className="flex justify-center mb-6">
          <LanguageToggle />
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 text-center sm:text-left">
              {isRegistering ? t('auth.registerAsGuide') : t('auth.login')}
            </h2>
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-2"
            >
              {isRegistering ? (
                <>
                  <ArrowPathIcon className="w-4 h-4" />
                  {t('auth.alreadyHaveAccount')}
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-4 h-4" />
                  {t('auth.dontHaveAccount')}
                </>
              )}
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            {isRegistering ? (
              // Formulario de registro
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Nombre completo */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className="label">
                    {t('auth.name')}
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className={`input ${errors.name ? 'input-error' : ''}`}
                    placeholder="Juan Pérez García"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="label">
                    {t('auth.email')}
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    placeholder="juan@ejemplo.com"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label htmlFor="phone" className="label">
                    {t('auth.phone')}
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    maxLength={9}
                    pattern="9[0-9]{8}"
                    inputMode="numeric"
                    onKeyPress={(e) => {
                      // Solo permitir números
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      // Limpiar pegado para solo números
                      const pastedData = e.clipboardData.getData('text');
                      const cleanedData = pastedData.replace(/\D/g, '').slice(0, 9);
                      e.preventDefault();
                      e.target.value = cleanedData;
                      setValue('phone', cleanedData);
                    }}
                    className={`input ${errors.phone ? 'input-error' : ''}`}
                    placeholder="987654321"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('auth.phoneHint')}</p>
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                {/* DNI */}
                <div>
                  <label htmlFor="dni" className="label">
                    {t('auth.dni')}
                  </label>
                  <input
                    {...register('dni')}
                    type="text"
                    id="dni"
                    maxLength={8}
                    pattern="[0-9]{8}"
                    inputMode="numeric"
                    onKeyPress={(e) => {
                      if (!/[0-9]/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      const pastedData = e.clipboardData.getData('text');
                      const cleanedData = pastedData.replace(/\D/g, '').slice(0, 8);
                      e.preventDefault();
                      e.target.value = cleanedData;
                      setValue('dni', cleanedData);
                    }}
                    className={`input ${errors.dni ? 'input-error' : ''}`}
                    placeholder="12345678"
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('auth.dniHint')}</p>
                  {errors.dni && (
                    <p className="mt-1 text-sm text-red-600">{errors.dni.message}</p>
                  )}
                </div>

                {/* Ciudad */}
                <div>
                  <label htmlFor="city" className="label">
                    {t('auth.city')}
                  </label>
                  <input
                    {...register('city')}
                    type="text"
                    id="city"
                    className={`input ${errors.city ? 'input-error' : ''}`}
                    placeholder="Lima, Perú"
                  />
                  {errors.city && (
                    <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                  )}
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="password" className="label">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label htmlFor="confirmPassword" className="label">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    {...register('confirmPassword')}
                    type="password"
                    id="confirmPassword"
                    className={`input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="••••••••"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Años de experiencia */}
                <div className="md:col-span-2">
                  <label htmlFor="experience" className="label">
                    {t('auth.experience')}
                  </label>
                  <input
                    {...register('experience')}
                    type="number"
                    id="experience"
                    min="0"
                    max="50"
                    className={`input ${errors.experience ? 'input-error' : ''}`}
                    placeholder="5"
                  />
                  {errors.experience && (
                    <p className="mt-1 text-sm text-red-600">{errors.experience.message}</p>
                  )}
                </div>

                {/* Foto de perfil */}
                <div className="md:col-span-2">
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    initialImage={null}
                    error={imageError || errors.profileImage?.message}
                  />
                </div>

                {/* Idiomas */}
                <div className="md:col-span-2">
                  <label className="label">{t('auth.languages')}</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {languageOptions.map((language) => (
                      <label
                        key={language.value}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedLanguages.includes(language.value)
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedLanguages.includes(language.value)}
                          onChange={() => handleLanguageToggle(language.value)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{t(language.labelKey)}</span>
                      </label>
                    ))}
                  </div>
                  {errors.languages && (
                    <p className="mt-1 text-sm text-red-600">{errors.languages.message}</p>
                  )}
                </div>

                {/* Especialidades */}
                <div className="md:col-span-2">
                  <label className="label">{t('auth.specialties')}</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {specialtyOptions.map((specialty) => (
                      <label
                        key={specialty.value}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedSpecialties.includes(specialty.value)
                            ? 'border-secondary-500 bg-secondary-50 text-secondary-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSpecialties.includes(specialty.value)}
                          onChange={() => handleSpecialtyToggle(specialty.value)}
                          className="sr-only"
                        />
                        <span className="text-sm font-medium">{t(specialty.labelKey)}</span>
                      </label>
                    ))}
                  </div>
                  {errors.specialties && (
                    <p className="mt-1 text-sm text-red-600">{errors.specialties.message}</p>
                  )}
                </div>

                {/* Experiencia en Museos - Entrada Manual */}
                <div className="md:col-span-2">
                  <label className="label">{t('auth.museumExperience')}</label>
                  <p className="text-sm text-gray-600 mb-3">
                    Agrega manualmente los museos donde tienes experiencia, años trabajados y tu nivel de expertise
                  </p>
                  
                  {/* Lista de museos agregados */}
                  {selectedMuseums.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {selectedMuseums.map((museum, index) => (
                        <div key={index} className="border border-orange-200 rounded-lg bg-orange-50 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-orange-700">Museo #{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const updatedMuseums = selectedMuseums.filter((_, i) => i !== index);
                                setSelectedMuseums(updatedMuseums);
                              }}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Museo *
                              </label>
                              <input
                                type="text"
                                value={museum.name || ''}
                                onChange={(e) => {
                                  const updatedMuseums = selectedMuseums.map((m, i) => 
                                    i === index ? { ...m, name: e.target.value } : m
                                  );
                                  setSelectedMuseums(updatedMuseums);
                                }}
                                className="w-full input text-sm"
                                placeholder="Ej: Museo Nacional de Arqueología"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Años de Experiencia
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                value={museum.years || ''}
                                onChange={(e) => {
                                  const updatedMuseums = selectedMuseums.map((m, i) => 
                                    i === index ? { ...m, years: parseInt(e.target.value) || 0 } : m
                                  );
                                  setSelectedMuseums(updatedMuseums);
                                }}
                                className="w-full input text-sm"
                                placeholder="5"
                              />
                            </div>
                            
                            <div className="sm:col-span-3">
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nivel de Expertise
                              </label>
                              <select
                                value={museum.expertise || 'basico'}
                                onChange={(e) => {
                                  const updatedMuseums = selectedMuseums.map((m, i) => 
                                    i === index ? { ...m, expertise: e.target.value } : m
                                  );
                                  setSelectedMuseums(updatedMuseums);
                                }}
                                className="w-full input text-sm"
                              >
                                <option value="basico">Básico</option>
                                <option value="intermedio">Intermedio</option>
                                <option value="avanzado">Avanzado</option>
                                <option value="experto">Experto</option>
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
                    onClick={() => {
                      setSelectedMuseums([...selectedMuseums, { name: '', years: 1, expertise: 'basico' }]);
                    }}
                    className="w-full border-2 border-dashed border-orange-300 rounded-lg py-3 px-4 text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <PlusIcon className="h-5 w-5" />
                    Agregar Experiencia en Museo
                  </button>

                  {errors.museums && (
                    <p className="mt-1 text-sm text-red-600">{errors.museums.message}</p>
                  )}
                </div>

                {/* Términos y condiciones */}
                <div className="md:col-span-2">
                  <div className="flex items-start">
                    <input
                      {...register('acceptTerms')}
                      type="checkbox"
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary mt-0.5"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Acepto los{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTermsModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-500 hover:underline font-medium"
                      >
                        términos y condiciones
                      </button>
                    </span>
                  </div>
                  {errors.acceptTerms && (
                    <p className="mt-1 text-sm text-red-600">{errors.acceptTerms.message}</p>
                  )}
                </div>
              </div>
            ) : (
              // Formulario de login
              <>
                {/* Email */}
                <div>
                  <label htmlFor="email" className="label">
                    {t('auth.email')}
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className={`input ${errors.email ? 'input-error' : ''}`}
                    placeholder="agencia@ejemplo.com"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="label">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                      placeholder="••••••••"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="w-5 h-5" />
                      ) : (
                        <EyeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Remember me */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      {...register('remember')}
                      type="checkbox"
                      className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                    />
                    <span className="ml-2 text-sm text-gray-700">{t('auth.rememberMe')}</span>
                  </label>
                  
                  <a href="#" className="text-sm text-primary hover:text-primary-600">
                    {t('auth.forgotPassword')}
                  </a>
                </div>
              </>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                  {isRegistering ? t('auth.registering') : t('auth.loggingIn')}
                </>
              ) : (
                isRegistering ? t('auth.register') : t('auth.login')
              )}
            </button>
          </form>

          {/* Demo credentials - Solo para login */}
          {!isRegistering && (
            <>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 text-center mb-3">
                  Acceso rápido - Usuarios de prueba
                </p>
                <div className="space-y-2">
                  {/* Botón Admin */}
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'admin@futurismo.pe');
                      setValue('password', 'Password123');
                      setValue('remember', true);
                      handleSubmit(onSubmit)();
                    }}
                    className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group border border-purple-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <ShieldCheckIcon className="w-4 h-4 text-purple-600" />
                          Administrador
                        </p>
                        <p className="text-xs text-gray-600 mt-1">admin@futurismo.pe</p>
                        <p className="text-xs text-gray-500">Password123</p>
                      </div>
                      <span className="text-xs text-purple-600 font-medium bg-purple-100 px-2 py-1 rounded">
                        Admin
                      </span>
                    </div>
                  </button>

                  {/* Botón Agencia */}
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'contacto@tourslima.com');
                      setValue('password', 'Password123');
                      setValue('remember', true);
                      handleSubmit(onSubmit)();
                    }}
                    className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group border border-blue-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <BuildingOffice2Icon className="w-4 h-4 text-blue-600" />
                          Agencia de Viajes
                        </p>
                        <p className="text-xs text-gray-600 mt-1">contacto@tourslima.com</p>
                        <p className="text-xs text-gray-500">Password123</p>
                      </div>
                      <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                        Agencia
                      </span>
                    </div>
                  </button>

                  {/* Botón Guía Planta */}
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'carlos@guia.com');
                      setValue('password', '9af34c9edffaA1!');
                      setValue('remember', true);
                      handleSubmit(onSubmit)();
                    }}
                    className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group border border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <MapIcon className="w-4 h-4 text-green-600" />
                          Guia de Planta
                        </p>
                        <p className="text-xs text-gray-600 mt-1">carlos@guia.com</p>
                        <p className="text-xs text-gray-500">Password123</p>
                      </div>
                      <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">
                        Planta
                      </span>
                    </div>
                  </button>

                  {/* Botón Guía Freelance */}
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'guia@gmail.com');
                      setValue('password', 'Guia1234');
                      setValue('remember', true);
                      handleSubmit(onSubmit)();
                    }}
                    className="w-full text-left px-4 py-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group border border-orange-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 flex items-center gap-2">
                          <UserPlusIcon className="w-4 h-4 text-orange-600" />
                          Guía Freelance
                        </p>
                        <p className="text-xs text-gray-600 mt-1">lucia@guia.com</p>
                        <p className="text-xs text-gray-500">Password123</p>
                      </div>
                      <span className="text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded">
                        Freelance
                      </span>
                    </div>
                  </button>

                </div>

                <p className="text-xs text-gray-500 text-center mt-4">
                  Haz clic en cualquier perfil para iniciar sesión automáticamente
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 mt-8">
          {t('auth.copyright')}
        </p>
      </div>

      {/* Modal de Términos y Condiciones */}
      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
        type="terms"
      />
    </div>
  );
};

export default LoginRegister;