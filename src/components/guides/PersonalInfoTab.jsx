import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { GUIDE_TYPES } from '../../constants/guidesConstants';

const PersonalInfoTab = ({ register, errors, validationRules }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('guides.comp.fullName')} *
          </label>
          <input
            {...register('fullName', validationRules.fullName)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={t('guides.comp.fullNamePlaceholder')}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('guides.comp.dniLabel')} *
          </label>
          <input
            {...register('dni', validationRules.dni)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="12345678"
            maxLength="8"
          />
          {errors.dni && (
            <p className="mt-1 text-sm text-red-600">{errors.dni.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('guides.comp.phoneLabel')} *
          </label>
          <input
            {...register('phone', validationRules.phone)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="987654321"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('guides.comp.emailLabel')} *
          </label>
          <input
            {...register('email', validationRules.email)}
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="correo@ejemplo.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('guides.comp.addressLabel')} *
        </label>
        <input
          {...register('address', validationRules.address)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Av. Principal 123, Lima"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('guides.comp.guideType')} *
        </label>
        <select
          {...register('guideType', validationRules.guideType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">{t('guides.comp.selectGuideType')}</option>
          <option value={GUIDE_TYPES.planta}>{t('guides.comp.guidePlanta')}</option>
          <option value={GUIDE_TYPES.freelance}>{t('guides.comp.guideFreelance')}</option>
        </select>
        {errors.guideType && (
          <p className="mt-1 text-sm text-red-600">{errors.guideType.message}</p>
        )}
      </div>
    </div>
  );
};

PersonalInfoTab.propTypes = {
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  validationRules: PropTypes.object.isRequired
};

export default PersonalInfoTab;
