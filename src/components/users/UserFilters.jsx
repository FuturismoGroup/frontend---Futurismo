import React from 'react';
import { MagnifyingGlassIcon, AdjustmentsHorizontalIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { USER_STATUS, GUIDE_TYPES } from '../../constants/usersConstants';

const UserFilters = ({
  filters,
  roles,
  showFilters,
  onSearch,
  onFilterChange,
  onToggleFilters,
  onClearFilters,
  hasActiveFilters
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('users.list.searchPlaceholder')}
                value={filters.search}
                onChange={onSearch}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm placeholder-gray-400 transition-all"
              />
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFilters}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                showFilters
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              {t('common.filters')}
              {hasActiveFilters && !showFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                  !
                </span>
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="inline-flex items-center gap-1 px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                <XMarkIcon className="h-4 w-4" />
                {t('search.clear')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="px-4 pb-4 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Role filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {t('users.list.role')}
              </label>
              <select
                value={filters.role}
                onChange={(e) => onFilterChange('role', e.target.value)}
                className="w-full bg-gray-50 border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">{t('users.list.allRoles')}</option>
                {roles.map(role => (
                  <option key={role.id} value={role.name}>{role.name}</option>
                ))}
              </select>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {t('users.list.status')}
              </label>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange('status', e.target.value)}
                className="w-full bg-gray-50 border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">{t('users.list.allStatuses')}</option>
                <option value={USER_STATUS.ACTIVE}>{t('users.status.active')}</option>
                <option value={USER_STATUS.INACTIVE}>{t('users.status.inactive')}</option>
              </select>
            </div>

            {/* Guide type filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                {t('users.list.guideType')}
              </label>
              <select
                value={filters.guideType}
                onChange={(e) => onFilterChange('guideType', e.target.value)}
                className="w-full bg-gray-50 border-0 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">{t('users.list.allTypes')}</option>
                <option value={GUIDE_TYPES.PLANT}>{t('users.guideType.plant')}</option>
                <option value={GUIDE_TYPES.FREELANCE}>{t('users.guideType.freelance')}</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserFilters;
