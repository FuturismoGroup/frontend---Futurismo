import React from 'react';
import {
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { USER_STATUS, USER_ROLES, GUIDE_TYPES } from '../../constants/usersConstants';
import { resolveFileUrl } from '../../utils/fileUrl';

// Función para generar iniciales del usuario
const getInitials = (firstName, lastName) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return `${first}${last}`;
};

// Función para obtener color de fondo basado en el nombre
const getAvatarColor = (name) => {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-cyan-500',
    'bg-pink-500',
    'bg-indigo-500'
  ];
  const index = name?.charCodeAt(0) % colors.length || 0;
  return colors[index];
};

// Configuración de badges por rol (labels use i18n keys)
const roleBadgeConfig = {
  administrator: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    dot: 'bg-red-500',
    labelKey: 'users.stats.administrators'
  },
  agency: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    dot: 'bg-violet-500',
    labelKey: 'users.stats.agencies'
  },
  guide: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    labelKey: 'users.stats.totalGuides'
  }
};

const UserTableRow = ({
  user,
  roles,
  onView,
  onEdit,
  onDelete,
  onPasswordReset,
  onStatusToggle,
  formatLastLogin
}) => {
  const { t } = useTranslation();

  // Obtener el nombre del rol de forma segura
  const roleName = typeof user.role === 'object' ? user.role?.name : user.role;
  const roleConfig = roleBadgeConfig[roleName?.toLowerCase()] || roleBadgeConfig.guide;

  // Determinar si el usuario está activo
  const isActive = user.status === USER_STATUS.ACTIVE || user.status === 'active';
  const isAgency = roleName?.toLowerCase() === 'agency';

  // Obtener guideType de forma segura (puede venir como user.guideType o user.guide.guide_type)
  const rawGuideType = user.guideType || user.guide?.guide_type || user.guide?.guideType;
  // Normalizar a mayúsculas para comparación consistente
  const guideType = rawGuideType?.toUpperCase?.() || rawGuideType;
  // El backend puede retornar 'PLANT' o 'AGENCY' para guías de planta
  const isPlantGuide = guideType === 'PLANT' || guideType === 'AGENCY' || guideType === GUIDE_TYPES.PLANT;

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      {/* Usuario */}
      <td className="px-4 lg:px-6 py-4">
        <div className="flex items-center gap-3">
          {/* Avatar con iniciales */}
          {user.avatar && !user.avatar.includes('ui-avatars') ? (
            <img
              src={resolveFileUrl(user.avatar)}
              alt={user.firstName}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
          ) : (
            <div className={`h-10 w-10 rounded-full ${getAvatarColor(user.firstName)} flex items-center justify-center ring-2 ring-white shadow-sm`}>
              <span className="text-white font-semibold text-sm">
                {getInitials(user.firstName, user.lastName)}
              </span>
            </div>
          )}

          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-gray-500 truncate">
              {user.email}
            </div>
            <div className="text-xs text-gray-400">
              @{user.username}
            </div>
          </div>
        </div>
      </td>

      {/* Rol */}
      <td className="px-4 lg:px-6 py-4">
        <div className="flex flex-col gap-1.5">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${roleConfig.bg} ${roleConfig.text} border ${roleConfig.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${roleConfig.dot}`}></span>
            {t(roleConfig.labelKey)}
          </span>

          {roleName?.toLowerCase() === 'guide' && guideType && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              isPlantGuide
                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {isPlantGuide
                ? t('users.guideType.plant')
                : t('users.guideType.freelance')}
            </span>
          )}
        </div>
      </td>

      {/* Estado - Mostrar status real para todos los usuarios */}
      <td className="px-4 lg:px-6 py-4">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-orange-100 text-orange-700 border border-orange-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-orange-400'}`}></span>
          {isActive ? t('users.status.active') : t('users.status.inactive')}
        </span>
      </td>

      {/* Último Login */}
      <td className="px-4 lg:px-6 py-4">
        <span className="text-sm text-gray-500">
          {formatLastLogin(user.lastLogin)}
        </span>
      </td>

      {/* Acciones */}
      <td className="px-4 lg:px-6 py-4">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => onView && onView(user)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('users.list.viewDetails')}
          >
            <EyeIcon className="h-4 w-4" />
          </button>

          <button
            onClick={() => onEdit && onEdit(user)}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title={t('users.list.editUser')}
          >
            <PencilSquareIcon className="h-4 w-4" />
          </button>

          <button
            onClick={() => onPasswordReset(user.id)}
            className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title={t('users.list.resetPassword')}
          >
            <KeyIcon className="h-4 w-4" />
          </button>

          {/* Toggle estado (no para agencias) */}
          {!isAgency && (
            <button
              onClick={() => onStatusToggle(user.id)}
              className={`p-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                  : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
              }`}
              title={isActive ? t('users.list.deactivate') : t('users.list.activate')}
            >
              {isActive ? (
                <XCircleIcon className="h-4 w-4" />
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
            </button>
          )}

          <button
            onClick={() => onDelete && onDelete(user)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title={t('users.list.deleteUser')}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default UserTableRow;
