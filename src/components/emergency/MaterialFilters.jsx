import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { getIconDisplay } from '../../utils/emergencyIcons';

const MaterialFilters = ({
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  showOnlyMandatory,
  setShowOnlyMandatory,
  categories
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('emergency.materials.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">{t('emergency.materials.allCategories')}</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {getIconDisplay(category.icon)} {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="mandatory-filter"
              checked={showOnlyMandatory}
              onChange={(e) => setShowOnlyMandatory(e.target.checked)}
              className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
            />
            <label htmlFor="mandatory-filter" className="text-sm font-medium text-gray-700">
              {t('emergency.materials.onlyMandatory')}
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

MaterialFilters.propTypes = {
  searchQuery: PropTypes.string.isRequired,
  setSearchQuery: PropTypes.func.isRequired,
  filterCategory: PropTypes.string.isRequired,
  setFilterCategory: PropTypes.func.isRequired,
  showOnlyMandatory: PropTypes.bool.isRequired,
  setShowOnlyMandatory: PropTypes.func.isRequired,
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired
  })).isRequired
};

export default MaterialFilters;