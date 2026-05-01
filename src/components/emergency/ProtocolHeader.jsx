import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ArrowLeftIcon, ArrowDownTrayIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getIconDisplay } from '../../utils/emergencyIcons';

const ProtocolHeader = ({ 
  protocol, 
  onClose, 
  onEdit, 
  onDownload, 
  canEdit, 
  getPriorityColor 
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-4">
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="text-3xl">{getIconDisplay(protocol?.icon)}</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {protocol?.title || 'Protocolo'}
            </h2>
            <div className="flex items-center space-x-3 mt-1">
              <span
                className={`px-3 py-1 text-sm font-medium rounded-full border ${getPriorityColor(protocol?.priority)}`}
              >
                {t('emergency.protocol.priority')} {protocol?.priority ? t(`emergency.priority.${protocol.priority}`).toUpperCase() : '-'}
              </span>
              <span className="text-sm text-gray-600">
                {t('emergency.protocol.category')}: {protocol?.category?.name || protocol?.category || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={onDownload}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          <span>{t('emergency.protocol.downloadPDF')}</span>
        </button>
        
        {canEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center space-x-2"
          >
            <PencilIcon className="w-4 h-4" />
            <span>{t('common.edit')}</span>
          </button>
        )}
        
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

ProtocolHeader.propTypes = {
  protocol: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDownload: PropTypes.func.isRequired,
  canEdit: PropTypes.bool.isRequired,
  getPriorityColor: PropTypes.func.isRequired
};

export default ProtocolHeader;