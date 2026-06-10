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
    <div className="flex items-start sm:items-center justify-between gap-2 sm:gap-3 p-3 sm:p-4 lg:p-6 border-b border-gray-200 bg-gray-50">
      <div className="flex items-start sm:items-center gap-2 sm:gap-4 min-w-0 flex-1">
        <button
          onClick={onClose}
          className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg transition-colors flex-shrink-0"
          aria-label={t('common.close')}
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>

        <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <div className="text-2xl sm:text-3xl flex-shrink-0">{getIconDisplay(protocol?.icon)}</div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 break-words">
              {protocol?.title || 'Protocolo'}
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-1">
              <span
                className={`px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-sm font-medium rounded-full border ${getPriorityColor(protocol?.priority)}`}
              >
                {t('emergency.protocol.priority')} {protocol?.priority ? t(`emergency.priority.${protocol.priority}`).toUpperCase() : '-'}
              </span>
              <span className="text-[10px] sm:text-sm text-gray-600 truncate">
                {t('emergency.protocol.category')}: {protocol?.category?.name || protocol?.category || '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* En móvil mostramos solo iconos para el descargar/editar */}
        <button
          onClick={onDownload}
          className="p-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          aria-label={t('emergency.protocol.downloadPDF')}
          title={t('emergency.protocol.downloadPDF')}
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{t('emergency.protocol.downloadPDF')}</span>
        </button>

        {canEdit && (
          <button
            onClick={onEdit}
            className="p-2 sm:px-4 sm:py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-2"
            aria-label={t('common.edit')}
            title={t('common.edit')}
          >
            <PencilIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('common.edit')}</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="hidden sm:inline-flex p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={t('common.close')}
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