import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PhoneIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

const ProtocolContacts = ({ 
  contactFields, 
  register, 
  appendContact, 
  removeContact,
  contactTypes 
}) => {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center">
          <PhoneIcon className="w-5 h-5 mr-2 text-red-500" />
          {t('emergency.protocol.emergencyContacts')}
        </h3>
        <button
          type="button"
          onClick={() => appendContact({ name: '', phone: '', type: 'emergency' })}
          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>{t('emergency.protocol.addContact')}</span>
        </button>
      </div>

      <div className="space-y-4">
        {contactFields.map((field, index) => (
          <div key={field.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('emergency.protocol.contactName')}
                </label>
                <input
                  {...register(`contacts.${index}.name`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={t('emergency.protocol.contactNamePlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('emergency.protocol.phone')}
                </label>
                <input
                  {...register(`contacts.${index}.phone`, {
                    pattern: {
                      value: /^9\d{8}$/,
                      message: t('validation.phoneMustBe9Digits')
                    }
                  })}
                  type="tel"
                  maxLength="9"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="999999999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('emergency.protocol.type')}
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    {...register(`contacts.${index}.type`)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {contactTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.labelKey ? t(type.labelKey) : type.label}
                      </option>
                    ))}
                  </select>
                  {contactFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContact(index)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      aria-label={t('common.delete')}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ProtocolContacts.propTypes = {
  contactFields: PropTypes.array.isRequired,
  register: PropTypes.func.isRequired,
  appendContact: PropTypes.func.isRequired,
  removeContact: PropTypes.func.isRequired,
  contactTypes: PropTypes.array.isRequired
};

export default ProtocolContacts;