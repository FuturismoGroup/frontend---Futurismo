import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const ExportFormatButtons = ({ 
  formats, 
  onExport, 
  isExporting, 
  totalReservations,
  selectedStatusLabel 
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-medium text-gray-700 sm:text-sm">
        {t('dashboard.export.exportFormat')}
      </h4>
      {formats.map((format) => (
        <button
          key={format.format}
          onClick={() => onExport(format.format)}
          disabled={isExporting || totalReservations === 0}
          className={`w-full flex items-center justify-between p-3 rounded-lg text-white font-medium transition-all sm:p-4 ${format.color} ${
            isExporting || totalReservations === 0 
              ? 'opacity-50 cursor-not-allowed' 
              : 'transform hover:scale-105 active:scale-95'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 sm:gap-3">
            <format.icon className="w-4 h-4 flex-shrink-0 sm:w-5 sm:h-5" />
            <div className="text-left min-w-0 flex-1">
              <div className="font-semibold text-xs sm:text-sm truncate" title={t('dashboard.export.exportButton', { count: totalReservations, format: format.label })}>
                {t('dashboard.export.exportButton', {
                  count: totalReservations,
                  format: format.label
                })}
              </div>
              <div className="text-xs opacity-90 hidden sm:block">
                {format.description} • {selectedStatusLabel}
              </div>
              <div className="text-xs opacity-90 block sm:hidden truncate" title={selectedStatusLabel}>
                {selectedStatusLabel}
              </div>
            </div>
          </div>
          {isExporting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0 sm:w-5 sm:h-5"></div>
          ) : (
            <ArrowDownTrayIcon className="w-4 h-4 flex-shrink-0 sm:w-5 sm:h-5" />
          )}
        </button>
      ))}
    </div>
  );
};

ExportFormatButtons.propTypes = {
  formats: PropTypes.arrayOf(PropTypes.shape({
    format: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired
  })).isRequired,
  onExport: PropTypes.func.isRequired,
  isExporting: PropTypes.bool.isRequired,
  totalReservations: PropTypes.number.isRequired,
  selectedStatusLabel: PropTypes.string.isRequired
};

export default ExportFormatButtons;