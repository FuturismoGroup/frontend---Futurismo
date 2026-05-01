import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PhoneIcon } from '@heroicons/react/24/outline';
import ContactTypeIcon from './ContactTypeIcon';

const ProtocolContactsList = ({ contacts = [] }) => {
  const { t } = useTranslation();

  if (!contacts || contacts.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <PhoneIcon className="w-5 h-5 mr-2 text-red-500" />
          {t('emergency.protocol.emergencyContacts')}
        </h3>
        <p className="text-gray-500 text-sm">{t('common.noData') || 'No hay contactos definidos'}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <PhoneIcon className="w-5 h-5 mr-2 text-red-500" />
        {t('emergency.protocol.emergencyContacts')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map((contact, index) => (
          <div
            key={index}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ContactTypeIcon type={contact?.type} className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-red-900">{contact?.name || 'Contacto'}</h4>
                <p className="text-red-700 font-mono text-lg font-bold">
                  {contact?.phone || '-'}
                </p>
                <p className="text-red-600 text-sm capitalize">
                  {contact?.type ? t(`emergency.protocol.contactTypes.${contact.type}`, contact.type) : '-'}
                </p>
              </div>
              {contact?.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  title={t('emergency.protocol.callNow')}
                >
                  <PhoneIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ProtocolContactsList.propTypes = {
  contacts: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string,
    phone: PropTypes.string,
    type: PropTypes.string
  }))
};

export default ProtocolContactsList;