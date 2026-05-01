import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PhoneIcon, EnvelopeIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';

const ProviderContactInfo = ({ register, errors }) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center">
        <PhoneIcon className="w-5 h-5 mr-2" />
        {t('providers.form.sections.contactInfo')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <UserIcon className="w-4 h-4 inline mr-1" />
            {t('providers.form.fields.contactPerson')} *
          </label>
          <input
            type="text"
            {...register('contact.contactPerson')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.contact?.contactPerson ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('providers.form.placeholders.contactPerson')}
          />
          {errors.contact?.contactPerson && (
            <p className="mt-1 text-sm text-red-600">{errors.contact.contactPerson.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <PhoneIcon className="w-4 h-4 inline mr-1" />
            {t('providers.form.fields.phone')} *
          </label>
          <input
            type="tel"
            {...register('contact.phone', {
              onChange: (e) => {
                // Solo permitir números
                e.target.value = e.target.value.replace(/\D/g, '');
              }
            })}
            onKeyPress={(e) => {
              // Bloquear entrada de caracteres no numéricos
              if (!/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              // Al pegar, filtrar solo números
              e.preventDefault();
              const pastedText = e.clipboardData.getData('text');
              const numbersOnly = pastedText.replace(/\D/g, '').slice(0, 9);
              e.target.value = numbersOnly;
              // Disparar evento de cambio para react-hook-form
              e.target.dispatchEvent(new Event('input', { bubbles: true }));
            }}
            maxLength={9}
            inputMode="numeric"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.contact?.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('providers.form.placeholders.phone')}
          />
          {errors.contact?.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.contact.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <EnvelopeIcon className="w-4 h-4 inline mr-1" />
            {t('providers.form.fields.email')} *
          </label>
          <input
            type="email"
            {...register('contact.email')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.contact?.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('providers.form.placeholders.email')}
          />
          {errors.contact?.email && (
            <p className="mt-1 text-sm text-red-600">{errors.contact.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPinIcon className="w-4 h-4 inline mr-1" />
            {t('providers.form.fields.address')} *
          </label>
          <input
            type="text"
            {...register('contact.address')}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              errors.contact?.address ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder={t('providers.form.placeholders.address')}
          />
          {errors.contact?.address && (
            <p className="mt-1 text-sm text-red-600">{errors.contact.address.message}</p>
          )}
        </div>
      </div>
    </div>
  );
};

ProviderContactInfo.propTypes = {
  register: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired
};

export default ProviderContactInfo;