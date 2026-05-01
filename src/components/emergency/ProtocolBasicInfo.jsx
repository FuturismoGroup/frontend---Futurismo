import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { getIconDisplay } from '../../utils/emergencyIcons';

const ProtocolBasicInfo = ({ 
  register, 
  errors, 
  categories, 
  watchedPriority,
  getPriorityColor,
  selectedIcon,
  setSelectedIcon,
  setValue,
  iconOptions 
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('emergency.protocol.protocolTitle')} *
        </label>
        <input
          {...register('title', { required: t('emergency.protocol.titleRequired') })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={t('emergency.protocol.titlePlaceholder')}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('emergency.protocol.category')} *
        </label>
        <select
          {...register('category', { required: t('emergency.protocol.categoryRequired') })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">{t('emergency.protocol.selectCategory')}</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {getIconDisplay(category.icon)} {category.name}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
        )}
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('emergency.protocol.priority')}
        </label>
        <select
          {...register('priority')}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${getPriorityColor(watchedPriority)}`}
        >
          <option value="baja">🟢 {t('emergency.protocol.priorities.low')}</option>
          <option value="media">🟡 {t('emergency.protocol.priorities.medium')}</option>
          <option value="alta">🔴 {t('emergency.protocol.priorities.high')}</option>
        </select>
      </div>

      {/* Icon */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('emergency.protocol.icon')}
        </label>
        <div className="flex items-center space-x-2">
          <div className="text-3xl p-2 border border-gray-300 rounded-lg bg-gray-50">
            {selectedIcon}
          </div>
          <select
            {...register('icon')}
            onChange={(e) => {
              setValue('icon', e.target.value);
              setSelectedIcon(e.target.value);
            }}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {iconOptions.map(icon => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

ProtocolBasicInfo.propTypes = {
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  categories: PropTypes.array.isRequired,
  watchedPriority: PropTypes.string.isRequired,
  getPriorityColor: PropTypes.func.isRequired,
  selectedIcon: PropTypes.string.isRequired,
  setSelectedIcon: PropTypes.func.isRequired,
  setValue: PropTypes.func.isRequired,
  iconOptions: PropTypes.array.isRequired
};

export default ProtocolBasicInfo;