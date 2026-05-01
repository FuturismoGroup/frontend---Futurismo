import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const ProtocolDescription = ({ protocol }) => {
  const { t } = useTranslation();

  return (
    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
      <h3 className="flex items-center mb-2 text-lg font-medium text-blue-900">
        <ShieldCheckIcon className="w-5 h-5 mr-2" />
        {t('emergency.protocol.protocolDescription')}
      </h3>
      <p className="text-blue-800">{protocol?.description || t('common.noDescription') || 'Sin descripción'}</p>
      <div className="mt-3 text-sm text-blue-700">
        <span className="font-medium">{t('emergency.protocol.lastUpdate')}:</span> {protocol?.lastUpdated || '-'}
      </div>
    </div>
  );
};

ProtocolDescription.propTypes = {
  protocol: PropTypes.shape({
    description: PropTypes.string,
    lastUpdated: PropTypes.string
  })
};

export default ProtocolDescription;