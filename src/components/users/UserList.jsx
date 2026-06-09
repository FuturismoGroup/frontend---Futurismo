import React, { useState } from 'react';
import { UserIcon, EyeIcon, PencilIcon, KeyIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useUserList } from '../../hooks/useUserList';
import { formatFullDateTime, getRoleClasses, getRoleName, getStatusClasses } from '../../utils/usersHelpers';
import { DEFAULT_VALUES, USER_STATUS, USER_ROLES } from '../../constants/usersConstants';
import UserStatCards from './UserStatCards';
import UserFilters from './UserFilters';
import UserTableRow from './UserTableRow';
import { resolveFileUrl } from '../../utils/fileUrl';

const UserList = ({ onEdit, onView, onDelete }) => {
  const { t } = useTranslation();
  const [passwordResetModal, setPasswordResetModal] = useState({ isOpen: false, user: null });
  const [successModal, setSuccessModal] = useState({ isOpen: false, password: '' });

  const {
    users,
    stats,
    roleStats,
    roles,
    showFilters,
    filters,
    handleSearch,
    handleFilterChange,
    handleStatusToggle,
    handlePasswordReset,
    clearFilters,
    setShowFilters,
    hasActiveFilters
  } = useUserList();

  const onPasswordReset = (userId) => {
    const user = users.find(u => u.id === userId);
    setPasswordResetModal({ isOpen: true, user });
  };

  const confirmPasswordReset = () => {
    if (passwordResetModal.user) {
      handlePasswordReset(passwordResetModal.user.id, null, (password) => {
        setPasswordResetModal({ isOpen: false, user: null });
        setSuccessModal({ isOpen: true, password });
      });
    }
  };

  const cancelPasswordReset = () => {
    setPasswordResetModal({ isOpen: false, user: null });
  };

  const getFormattedLastLogin = (lastLogin) => {
    const formatted = formatFullDateTime(lastLogin);
    return formatted || t('users.list.never');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Estadísticas */}
      <UserStatCards roleStats={roleStats} />

      {/* Barra de búsqueda y filtros */}
      <UserFilters
        filters={filters}
        roles={roles}
        showFilters={showFilters}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onToggleFilters={() => setShowFilters(!showFilters)}
        onClearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters()}
      />

      {/* Vista desktop - Tabla */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50/80">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('users.list.user')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('users.list.role')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('users.list.status')}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('users.list.lastLogin')}
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  roles={roles}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onPasswordReset={onPasswordReset}
                  onStatusToggle={handleStatusToggle}
                  formatLastLogin={getFormattedLastLogin}
                />
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('users.list.noUsers')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters()
                ? t('users.list.noUsersWithFilters')
                : t('users.list.createFirstUser')
              }
            </p>
          </div>
        )}
      </div>

      {/* Vista móvil - Tarjetas */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <div key={user.id} className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <img
                  src={resolveFileUrl(user.avatar)}
                  alt={user.firstName}
                  className="h-10 w-10 rounded-full"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-xs text-gray-500">@{user.username}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onView && onView(user)}
                  className="text-gray-600 hover:text-gray-900 p-1"
                  title={t('users.list.viewDetails')}
                >
                  <EyeIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEdit && onEdit(user)}
                  className="text-blue-600 hover:text-blue-900 p-1"
                  title={t('users.list.editUser')}
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onPasswordReset(user.id)}
                  className="text-yellow-600 hover:text-yellow-900 p-1"
                  title={t('users.list.resetPassword')}
                >
                  <KeyIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{t('users.list.role')}:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleClasses(user.role, roles)}`}>
                  {getRoleName(user.role, roles)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{t('users.list.status')}:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClasses(user.status)}`}>
                  {user.status === USER_STATUS.ACTIVE ? t('users.status.active') : t('users.status.inactive')}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{t('users.list.lastLogin')}:</span>
                <span className="text-xs text-gray-900">{getFormattedLastLogin(user.lastLogin)}</span>
              </div>
            </div>
          </div>
        ))}
        
        {users.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('users.list.noUsers')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters()
                ? t('users.list.noUsersWithFilters')
                : t('users.list.createFirstUser')
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de confirmación para resetear contraseña */}
      {passwordResetModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={cancelPasswordReset} />

            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 transform transition-all">
              <button
                onClick={cancelPasswordReset}
                className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 min-h-[40px] min-w-[40px] flex items-center justify-center"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>

              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-amber-100 mb-3 sm:mb-4">
                  <KeyIcon className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  {t('users.list.resetPassword')}
                </h3>

                <p className="text-xs sm:text-sm text-gray-500 mb-2">
                  {t('users.list.confirmPasswordReset')}
                </p>

                {passwordResetModal.user && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 sm:mb-4">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {passwordResetModal.user.firstName} {passwordResetModal.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      @{passwordResetModal.user.username}
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-4 sm:mb-6">
                  {t('profile.comp.security.passwordRecommendation', { defaultValue: 'Se generará una nueva contraseña temporal que deberás compartir con el usuario.' })}
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={cancelPasswordReset}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={confirmPasswordReset}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                >
                  {t('users.list.resetPassword')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito con la nueva contraseña */}
      {successModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setSuccessModal({ isOpen: false, password: '' })} />

            <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-4 sm:p-6 transform transition-all">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                  <CheckCircleIcon className="h-7 w-7 text-green-600" />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('profile.comp.security.passwordUpdated', { defaultValue: 'Contraseña Reseteada' })}
                </h3>

                <p className="text-sm text-gray-500 mb-4">
                  {t('users.list.passwordResetSuccess', { password: '' }).replace(': ', ':')}
                </p>

                <div className="bg-gray-900 rounded-lg p-4 mb-4">
                  <code className="text-lg font-mono text-green-400 select-all">
                    {successModal.password}
                  </code>
                </div>

                <p className="text-xs text-amber-600 mb-6">
                  {t('profile.comp.security.securityNoteDesc', { defaultValue: 'Guarda esta contraseña. No se mostrará de nuevo.' })}
                </p>
              </div>

              <button
                onClick={() => setSuccessModal({ isOpen: false, password: '' })}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;