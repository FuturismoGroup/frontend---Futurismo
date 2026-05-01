import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  UserPlusIcon,
  UsersIcon,
  ArrowLeftIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import { useUsersStore } from '../stores/usersStoreSimple';
import usersService from '../services/usersService';
import { GUIDE_SPECIALTIES } from '../constants/guidesConstants';
import { getLanguageName } from '../config/languages';

const Users = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit', 'view'
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });

  const { deleteUser, getUsersStatistics } = useUsersStore();

  const handleCreateUser = () => {
    setSelectedUser(null);
    setCurrentView('create');
  };

  const handleEditUser = async (user) => {
    // Validar que el usuario no esté eliminado antes de editar
    if (user.deletedAt) {
      toast.error(t('users.form.cannotEditDeleted'));
      return;
    }

    // Cargar datos completos ANTES de abrir el modal
    // (la lista solo trae id, guide_type, rating del guía — sin idiomas, especialidades, etc.)
    let fullUser = user;
    try {
      const result = await usersService.getUserById(user.id);
      if (result.success) {
        fullUser = result.data;
      } else if (result.status === 410) {
        toast.error(t('users.form.cannotEditDeleted'));
        return;
      }
    } catch (err) {
      // Fallback: abrir con datos parciales de la lista
    }

    setSelectedUser(fullUser);
    setCurrentView('edit');
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setCurrentView('view');
    // Cargar datos completos del usuario (la lista solo trae datos parciales)
    try {
      const result = await usersService.getUserById(user.id);
      if (result.success) {
        setSelectedUser(result.data);
      } else if (result.status === 410) {
        toast.error('Este usuario ha sido eliminado');
        setCurrentView('list');
        setSelectedUser(null);
        // Refrescar lista para eliminar el usuario obsoleto
        const { initialize } = useUsersStore.getState();
        useUsersStore.setState({ hasInitialized: false });
        await initialize();
      }
    } catch (err) {
      // Si falla, seguimos mostrando los datos de la lista
    }
  };

  const handleDeleteUser = (user) => {
    setDeleteModal({ isOpen: true, user });
  };

  const confirmDelete = async () => {
    if (deleteModal.user) {
      try {
        await deleteUser(deleteModal.user.id);
        // Solo cerrar el modal si la eliminación fue exitosa
        setDeleteModal({ isOpen: false, user: null });
        toast.success('Usuario eliminado correctamente');
      } catch (error) {
        // Mostrar el error pero mantener el modal abierto
        console.error('Error al eliminar usuario:', error);
        toast.error(`Error al eliminar usuario: ${error.message}`);
        // NO cerrar el modal para que el usuario pueda reintentar
      }
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, user: null });
  };

  const handleFormSubmit = async () => {
    // El guardado real ocurre en UserForm.jsx (createUser/updateUser)
    // Esperar a que termine y recargar la lista antes de cerrar el modal
    try {
      // Recargar la lista de usuarios desde el store para sincronizar
      const { initialize } = useUsersStore.getState();
      await initialize();

      setCurrentView('list');
      setSelectedUser(null);
    } catch (error) {
      console.error('Error al refrescar usuarios:', error);
      // Aún así cerramos el modal porque el usuario ya fue creado/actualizado
      setCurrentView('list');
      setSelectedUser(null);
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedUser(null);
  };

  const renderHeader = () => {
    const titles = {
      list: t('users.management') || 'Gestión de Usuarios',
      create: t('users.form.newUser') || 'Nuevo Usuario',
      edit: `${t('users.form.editUser') || 'Editar Usuario'}: ${selectedUser?.firstName} ${selectedUser?.lastName}`,
      view: `${t('users.details') || 'Detalles de'}: ${selectedUser?.firstName} ${selectedUser?.lastName}`
    };

    return (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center">
          {currentView !== 'list' && (
            <button
              onClick={handleCancel}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}
          <div className="flex items-center">
            <UsersIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">
              {titles[currentView]}
            </h1>
          </div>
        </div>

        {currentView === 'list' && (
          <button
            onClick={handleCreateUser}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Nuevo Usuario
          </button>
        )}
      </div>
    );
  };

  const UserDetails = ({ user }) => {
    const guide = user.guide;
    const agency = user.agency;
    const roleName = typeof user.role === 'object' ? user.role?.name : user.role;
    const isGuide = roleName === 'guide';
    const isFreelance = guide?.guideType === 'FREELANCE' || guide?.guide_type === 'FREELANCE';
    const isAgency = roleName === 'agency';

    // Foto de perfil: profilePhoto del user o guidePhoto del guide
    const photoUrl = user.profilePhoto || guide?.guidePhoto || guide?.guide_photo;
    const photoSrc = photoUrl || null;

    // Parsear idiomas y especialidades (pueden ser JSON string o array)
    const parseJsonField = (field) => {
      if (!field) return [];
      if (Array.isArray(field)) return field;
      try { return JSON.parse(field); } catch { return []; }
    };

    const languages = parseJsonField(guide?.languages);
    const specialties = parseJsonField(guide?.specialties);
    const museums = parseJsonField(guide?.museums);

    // Mapear código de idioma a label (soporta ISO y legacy)
    const getLanguageLabel = (lang) => {
      const code = typeof lang === 'object' ? lang.code : lang;
      return getLanguageName(code);
    };

    const getSpecialtyLabel = (spec) => {
      const found = GUIDE_SPECIALTIES.find(s => s.value === spec);
      return found?.labelKey ? t(found.labelKey) : spec;
    };

    const statusConfig = {
      active: { className: 'bg-green-100 text-green-800' },
      pending_approval: { className: 'bg-yellow-100 text-yellow-800' },
      suspended: { className: 'bg-red-100 text-red-800' },
      inactive: { className: 'bg-gray-100 text-gray-800' }
    };
    const statusEntry = statusConfig[user.status];
    const statusInfo = {
      label: t(`users.status.${user.status}`, user.status),
      className: statusEntry?.className || 'bg-gray-100 text-gray-800'
    };

    const getRoleLabel = (name) => {
      if (name === 'guide') return isFreelance ? t('users.form.guideFreelance') : t('users.form.guidePlant');
      const roleMap = {
        admin: t('users.stats.administrators'),
        administrator: t('users.stats.administrators'),
        agency: t('users.stats.agencies'),
      };
      return roleMap[name] || name;
    };

    return (
      <div className="space-y-6">
        {/* Cabecera con foto y datos principales */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex-shrink-0">
              {photoSrc ? (
                <img
                  src={photoSrc}
                  alt={user.firstName}
                  className="h-28 w-28 rounded-full object-cover border-4 border-gray-100"
                />
              ) : (
                <div className="h-28 w-28 rounded-full bg-primary-100 flex items-center justify-center border-4 border-gray-100">
                  <span className="text-3xl font-bold text-primary-600">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-500 mt-1">@{user.username}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {getRoleLabel(roleName)}
                </span>
                {isGuide && guide?.rating && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                    {'★'} {Number(guide.rating).toFixed(1)}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                onClick={() => handleEditUser(user)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Editar Usuario
              </button>
            </div>
          </div>
        </div>

        {/* Información personal y contacto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nombre completo</dt>
                <dd className="text-sm text-gray-900">{user.firstName} {user.lastName}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                <dd className="text-sm text-gray-900">{user.phone || 'No registrado'}</dd>
              </div>
              {(user.documentType || user.documentNumber) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Documento</dt>
                  <dd className="text-sm text-gray-900">
                    {(user.documentType || 'DNI').toUpperCase()}: {user.documentNumber || 'No registrado'}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información del Sistema</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Usuario</dt>
                <dd className="text-sm text-gray-900">@{user.username}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Último Login</dt>
                <dd className="text-sm text-gray-900">
                  {user.lastLogin
                    ? new Date(user.lastLogin).toLocaleDateString('es-PE') + ' ' +
                      new Date(user.lastLogin).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                    : 'Nunca'
                  }
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Fecha de Registro</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString('es-PE')}
                </dd>
              </div>
              {user.updatedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Última Actualización</dt>
                  <dd className="text-sm text-gray-900">
                    {new Date(user.updatedAt).toLocaleDateString('es-PE')}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Datos del Guía (solo si es guía) */}
        {isGuide && guide && (
          <>
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información del Guía {isFreelance ? 'Freelance' : 'de Planta'}
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                  <dd className="text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      isFreelance ? 'bg-orange-100 text-orange-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {isFreelance ? 'Freelance' : 'Planta'}
                    </span>
                  </dd>
                </div>
                {(guide.yearsOfExperience != null || guide.years_of_experience != null) && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Años de Experiencia</dt>
                    <dd className="text-sm text-gray-900">{guide.yearsOfExperience ?? guide.years_of_experience ?? 0} años</dd>
                  </div>
                )}
                {(guide.licenseNumber || guide.license_number) && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">N° de Licencia</dt>
                    <dd className="text-sm text-gray-900">{guide.licenseNumber || guide.license_number}</dd>
                  </div>
                )}
                {guide.bio && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-sm font-medium text-gray-500">Biografía</dt>
                    <dd className="text-sm text-gray-900">{guide.bio}</dd>
                  </div>
                )}
                {guide.education && (
                  <div className="sm:col-span-2 lg:col-span-3">
                    <dt className="text-sm font-medium text-gray-500">Educación</dt>
                    <dd className="text-sm text-gray-900">{guide.education}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Idiomas */}
            {languages.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Idiomas</h3>
                <div className="flex flex-wrap gap-2">
                  {languages.map((lang, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {getLanguageLabel(lang)}
                      {typeof lang === 'object' && lang.level && (
                        <span className="ml-1.5 text-xs text-indigo-500">({lang.level})</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Especialidades */}
            {specialties.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((spec, i) => (
                    <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {getSpecialtyLabel(spec)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Museos */}
            {museums.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Experiencia en Museos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {museums.map((museum, i) => (
                    <div key={i} className="border border-orange-200 rounded-lg bg-orange-50 p-3">
                      <p className="font-medium text-orange-800 text-sm">
                        {typeof museum === 'string' ? museum : museum.name || museum.id || `Museo #${i + 1}`}
                      </p>
                      {typeof museum === 'object' && (
                        <div className="mt-1 text-xs text-orange-600 space-y-0.5">
                          {museum.years && <p>{museum.years} años de experiencia</p>}
                          {museum.expertise && <p>Nivel: {museum.expertise}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Datos de la Agencia (solo si es agencia) */}
        {isAgency && agency && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Agencia</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(agency.businessName || agency.business_name) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Razón Social</dt>
                  <dd className="text-sm text-gray-900">{agency.businessName || agency.business_name}</dd>
                </div>
              )}
              {agency.ruc && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">RUC</dt>
                  <dd className="text-sm text-gray-900">{agency.ruc}</dd>
                </div>
              )}
              {(agency.agencyPhone || agency.agency_phone) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                  <dd className="text-sm text-gray-900">{agency.agencyPhone || agency.agency_phone}</dd>
                </div>
              )}
              {(agency.agencyEmail || agency.agency_email) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="text-sm text-gray-900">{agency.agencyEmail || agency.agency_email}</dd>
                </div>
              )}
              {(agency.agencyAddress || agency.agency_address) && (
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Dirección</dt>
                  <dd className="text-sm text-gray-900">{agency.agencyAddress || agency.agency_address}</dd>
                </div>
              )}
              {agency.level && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nivel</dt>
                  <dd className="text-sm text-gray-900">{agency.level}</dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {renderHeader()}

        {/* Lista de usuarios - siempre visible excepto en vista detalle */}
        {currentView !== 'view' && (
          <UserList
            onEdit={handleEditUser}
            onView={handleViewUser}
            onDelete={handleDeleteUser}
          />
        )}

        {/* Modal de creación/edición - se superpone sobre la lista */}
        {(currentView === 'create' || currentView === 'edit') && (
          <UserForm
            user={selectedUser}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        )}

        {currentView === 'view' && selectedUser && (
          <UserDetails user={selectedUser} />
        )}

        {/* Información adicional */}
        {currentView === 'list' && (
          <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-0">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 sm:mr-3 flex-shrink-0" />
              <div className="text-xs sm:text-sm text-blue-800">
                <h4 className="font-medium mb-1 sm:mb-2">Gestión de Usuarios</h4>
                <p className="mb-2">
                  Desde aquí puedes administrar todos los usuarios del sistema. Puedes crear nuevos usuarios,
                  editar información existente, asignar roles y permisos, y controlar el acceso al sistema.
                </p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs sm:text-sm">
                  <li>Los roles determinan los permisos base del usuario</li>
                  <li>Puedes personalizar permisos individuales para cada usuario</li>
                  <li>Los usuarios inactivos no pueden acceder al sistema</li>
                  <li>Se puede resetear la contraseña desde las acciones de usuario</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {deleteModal.isOpen && (
          <div className="modal-overlay">
            <div className="modal-dialog modal-sm">
              <div className="modal-content">
                <div className="modal-header border-b-0 pb-0">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="modal-close"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="modal-body text-center pt-0">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                    <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('users.deleteModal.title')}
                  </h3>

                  <p className="text-sm text-gray-500 mb-2">
                    {t('users.deleteModal.message')}
                  </p>

                  <p className="text-sm font-medium text-gray-700">
                    {deleteModal.user?.firstName} {deleteModal.user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400">
                    @{deleteModal.user?.username}
                  </p>
                </div>

                <div className="modal-footer border-t-0 pt-0 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="btn btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="btn bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                  >
                    {t('users.deleteModal.confirm')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;