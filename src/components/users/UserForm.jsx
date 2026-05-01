import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useUsersStore } from '../../stores/usersStoreSimple';
import { useTranslation } from 'react-i18next';
import {
  FORM_LIMITS,
  VALIDATION_PATTERNS,
  USER_STATUS,
  DEFAULT_PREFERENCES
} from '../../constants/usersConstants';
import { normalizeLanguageCode } from '../../config/languages';
import UserFormTabs from './UserFormTabs';
import UserBasicInfoForm from './UserBasicInfoForm';

// Schema base con campos comunes
const baseSchema = (t) => ({
  username: yup
    .string()
    .required(t('users.form.errors.usernameRequired'))
    .min(FORM_LIMITS.USERNAME_MIN, t('users.form.errors.usernameMin'))
    .matches(VALIDATION_PATTERNS.USERNAME, t('users.form.errors.usernamePattern')),
  email: yup
    .string()
    .required(t('users.form.errors.emailRequired'))
    .email(t('users.form.errors.emailInvalid')),
  firstName: yup
    .string()
    .required(t('users.form.errors.firstNameRequired'))
    .min(FORM_LIMITS.NAME_MIN, t('users.form.errors.firstNameMin')),
  lastName: yup
    .string()
    .required(t('users.form.errors.lastNameRequired'))
    .min(FORM_LIMITS.NAME_MIN, t('users.form.errors.lastNameMin')),
  phone: yup
    .string()
    .required(t('users.form.errors.phoneRequired'))
    .matches(VALIDATION_PATTERNS.PHONE, t('users.form.errors.phoneInvalid')),
  role: yup
    .string()
    .required(t('users.form.errors.roleRequired')),
  status: yup
    .string()
    .when('role', {
      is: (role) => role !== 'agency',
      then: (schema) => schema.required(t('users.form.errors.statusRequired')),
      otherwise: (schema) => schema.notRequired()
    }),
  // Agency-specific fields
  businessName: yup
    .string()
    .when('role', {
      is: 'agency',
      then: (schema) => schema.required(t('users.form.errors.businessNameRequired')),
      otherwise: (schema) => schema.notRequired()
    }),
  ruc: yup
    .string()
    .when('role', {
      is: 'agency',
      then: (schema) => schema
        .required(t('users.form.errors.rucRequired'))
        .matches(/^(10|15|17|20)\d{9}$/, t('users.form.rucHint')),
      otherwise: (schema) => schema.notRequired()
    }),
  address: yup
    .string()
    .when('role', {
      is: 'agency',
      then: (schema) => schema.required(t('users.form.errors.addressRequired')),
      otherwise: (schema) => schema.notRequired()
    }),
  // Guide type - requerido cuando rol es guide
  guideType: yup
    .string()
    .when('role', {
      is: 'guide',
      then: (schema) => schema
        .required(t('users.form.errors.guideTypeRequired'))
        .oneOf(['AGENCY', 'FREELANCE'], t('users.form.errors.guideTypeRequired')),
      otherwise: (schema) => schema.notRequired()
    }),
  // Guide Freelance fields
  dni: yup
    .string()
    .when(['role', 'guideType'], {
      is: (role, guideType) => role === 'guide' && guideType === 'FREELANCE',
      then: (schema) => schema
        .required(t('users.form.dniRequired'))
        .matches(/^\d{8}$/, t('users.form.dniPattern')),
      otherwise: (schema) => schema.notRequired()
    })
});

// Schema para crear usuario (password obligatorio)
const createUserSchema = (t) => yup.object({
  ...baseSchema(t),
  password: yup
    .string()
    .required(t('users.form.errors.passwordRequired'))
    .min(FORM_LIMITS.PASSWORD_MIN, t('users.form.errors.passwordMin'))
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, t('users.form.errors.passwordPattern')),
  confirmPassword: yup
    .string()
    .required(t('users.form.errors.confirmPasswordRequired'))
    .oneOf([yup.ref('password')], t('users.form.errors.passwordMismatch'))
});

// Schema para editar usuario (sin contraseña - el backend no la acepta en PUT /users/:id)
const editUserSchema = (t) => yup.object({
  ...baseSchema(t)
});

// Normaliza un array de idiomas a códigos ISO simples (la DB puede tener objetos o strings legacy)
const normalizeLanguages = (languages) => {
  if (!Array.isArray(languages)) return [];
  return languages
    .map(lang => normalizeLanguageCode(typeof lang === 'string' ? lang : lang?.code))
    .filter(Boolean);
};

// Normaliza datos del guía independientemente del formato (snake_case de lista o camelCase de detalle)
const normalizeGuideData = (guide) => {
  if (!guide) return null;
  return {
    guideType: guide.guideType || guide.guide_type || '',
    licenseNumber: guide.licenseNumber || guide.license_number || '',
    yearsOfExperience: guide.yearsOfExperience ?? guide.years_of_experience ?? '',
    languages: normalizeLanguages(guide.languages),
    specialties: Array.isArray(guide.specialties) ? guide.specialties : [],
    museums: Array.isArray(guide.museums) ? guide.museums : [],
    bio: guide.bio || '',
    hourlyRate: guide.hourlyRate || guide.hourly_rate || '',
  };
};

// Normaliza datos de agencia independientemente del formato
const normalizeAgencyData = (agency) => {
  if (!agency) return null;
  return {
    businessName: agency.businessName || agency.business_name || '',
    ruc: agency.ruc || '',
    agencyAddress: agency.agencyAddress || agency.agency_address || '',
  };
};

// Construye los defaultValues normalizados a partir de un objeto user
const buildFormValues = (user, getRoleName) => {
  const guide = normalizeGuideData(user?.guide);
  const agency = normalizeAgencyData(user?.agency);
  return {
    username: user?.username || '',
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    role: getRoleName(user?.role),
    status: user?.status || USER_STATUS.ACTIVE,
    avatar: user?.profilePhoto || user?.avatar || '',
    businessName: agency?.businessName || '',
    ruc: agency?.ruc || '',
    address: agency?.agencyAddress || '',
    guideType: guide?.guideType || '',
    licenseNumber: guide?.licenseNumber || '',
    yearsOfExperience: guide?.yearsOfExperience ?? '',
    languages: guide?.languages || [],
    specialties: guide?.specialties || [],
    bio: guide?.bio || '',
    dni: user?.dni || user?.documentNumber || '',
    city: user?.city || '',
    hourlyRate: guide?.hourlyRate || '',
    museums: guide?.museums || [],
  };
};

const UserForm = ({ user = null, onSubmit, onCancel, isLoading = false }) => {
  const { t } = useTranslation();
  const {
    fetchRoles,
    roles: storeRoles,
    createUser,
    updateUser
  } = useUsersStore();

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [submitError, setSubmitError] = useState(null);

  const isEdit = !!user;
  // Usar el schema apropiado según el modo (crear vs editar)
  const userSchema = isEdit ? editUserSchema(t) : createUserSchema(t);

  // Extraer el nombre del rol (puede venir como objeto o string)
  const getRoleName = (role) => {
    if (!role) return '';
    if (typeof role === 'object') return role.name || '';
    return role;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(userSchema),
    defaultValues: buildFormValues(user, getRoleName)
  });

  useEffect(() => {
    // Cargar roles desde API real (sin fallback hardcodeado)
    const loadRoles = async () => {
      setRolesLoading(true);
      try {
        await fetchRoles();
      } catch (error) {
        console.error('Error al cargar roles:', error);
      } finally {
        setRolesLoading(false);
      }
    };
    loadRoles();
  }, [fetchRoles]);

  // Sincronizar roles del store con estado local
  useEffect(() => {
    if (storeRoles?.length > 0) {
      setRoles(storeRoles);
    }
  }, [storeRoles]);

  // Resetear el formulario cuando cambia el usuario (para edición / datos completos cargados)
  useEffect(() => {
    if (user) {
      reset(buildFormValues(user, getRoleName));
    }
  }, [user, reset]);

  const handleFormSubmit = async (data) => {
    // FIX: En modo edición, el campo role está deshabilitado y React Hook Form no lo incluye
    // Por eso usamos el rol del usuario existente cuando estamos editando
    const effectiveRole = isEdit ? getRoleName(user?.role) : data.role;

    // Estructurar datos según lo que espera el backend
    const userData = {
      username: data.username,
      email: data.email,
      ...(data.password && { password: data.password }), // FIX-F02: Solo incluir si tiene valor
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: effectiveRole,
      status: effectiveRole === 'agency' ? USER_STATUS.ACTIVE : data.status,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      profilePhoto: data.avatar
    };

    // Si es rol agency, agregar agencyData
    if (effectiveRole === 'agency') {
      userData.agencyData = {
        businessName: data.businessName,
        ruc: data.ruc,
        agencyPhone: data.phone,
        agencyEmail: data.email,
        agencyAddress: data.address
      };
    }

    // Si es rol guide, agregar guideData
    if (effectiveRole === 'guide') {
      // Función para convertir string separado por comas a array
      const parseToArray = (value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string' && value.trim()) {
          return value.split(',').map(item => item.trim()).filter(item => item);
        }
        return [];
      };

      // Guía de Planta (empleado interno) - solo campos propios, sin enviar arrays vacíos
      if (data.guideType === 'AGENCY') {
        userData.guideData = {
          guideType: 'AGENCY',
          licenseNumber: data.licenseNumber || null
        };
      }
      // Guía Freelance - todos los campos
      else {
        userData.guideData = {
          guideType: 'FREELANCE',
          licenseNumber: data.licenseNumber,
          yearsOfExperience: data.yearsOfExperience ? parseInt(data.yearsOfExperience) : 0,
          languages: parseToArray(data.languages),
          specialties: parseToArray(data.specialties),
          bio: data.bio || ''
        };

        // Campos adicionales para Freelance
        userData.dni = data.dni;
        userData.city = data.city;
        userData.guideData.museums = data.museums || [];
      }
    }

    try {
      setSubmitError(null);
      if (isEdit) {
        // Para actualización, el backend NO permite: username, role
        // Solo enviar campos permitidos: email, firstName, lastName, phone, status,
        // documentType, documentNumber, profilePhoto, guideData, agencyData, dni, city
        const updateData = {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          status: userData.status,
          documentType: userData.documentType,
          documentNumber: userData.dni || userData.documentNumber,
          profilePhoto: userData.profilePhoto,
          ...(userData.city && { city: userData.city })
        };

        // Incluir guideData o agencyData si existen
        if (userData.guideData) {
          updateData.guideData = userData.guideData;
        }
        if (userData.agencyData) {
          updateData.agencyData = userData.agencyData;
        }

        await updateUser(user.id, updateData);
      } else {
        await createUser(userData);
      }

      if (onSubmit) {
        onSubmit(userData);
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      // Mostrar error al usuario
      setSubmitError(error.message || t('users.form.saveError'));
    }
  };


  // Mostrar loading mientras cargan los roles
  if (rolesLoading) {
    return (
      <div className="modal-overlay">
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {isEdit ? t('users.form.editUser') : t('users.form.newUser')}
              </h2>
              <button
                type="button"
                onClick={onCancel}
                className="modal-close"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="modal-body flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">{t('users.form.loadingForm')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">
              {isEdit ? t('users.form.editUser') : t('users.form.newUser')}
            </h2>
            <button
              type="button"
              onClick={onCancel}
              className="modal-close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="modal-body overflow-y-auto">
              {/* Error de submit */}
              {submitError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <XMarkIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">{t('users.form.saveError')}</p>
                    <p className="text-sm text-red-600">{submitError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSubmitError(null)}
                    className="ml-auto text-red-400 hover:text-red-600"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Tabs - Sticky */}
              <div className="sticky -top-6 bg-white z-20 pt-6 -mt-6 pb-4 mb-2 border-b border-gray-100">
                <UserFormTabs activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>

              {/* Form Content */}
              {activeTab === 'basic' && (
                <UserBasicInfoForm
                  register={register}
                  errors={errors}
                  watch={watch}
                  setValue={setValue}
                  roles={roles}
                  isEdit={isEdit}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  showConfirmPassword={showConfirmPassword}
                  setShowConfirmPassword={setShowConfirmPassword}
                />
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={onCancel}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                {t('common.cancel')}
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                {isLoading ? t('users.form.saving') : (isEdit ? t('users.form.update') : t('users.form.create'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserForm;