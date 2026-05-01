import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import useExportModal from '../../hooks/useExportModal';
import ExportFormatOption from './ExportFormatOption';
import ExportStatsPreview from './ExportStatsPreview';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  onExport, 
  reservationCount = 0,
  filterStatus = 'all',
  stats = {}
}) => {
  const { t } = useTranslation();
  const {
    selectedFormat,
    setSelectedFormat,
    isExporting,
    formatOptions,
    getStatusLabel,
    handleExport: handleExportAction,
    resetSelection
  } = useExportModal(reservationCount, filterStatus);

  if (!isOpen) return null;

  const handleExport = () => {
    handleExportAction(onExport, onClose);
  };

  const handleClose = () => {
    if (!isExporting) {
      resetSelection();
      onClose();
    }
  };

  return (
    <div className="modal-overlay p-0 sm:p-4" onClick={handleClose}>
      <div
        className="modal-content w-full max-w-none sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary-600 to-primary-700 px-4 sm:px-8 py-4 sm:py-6 rounded-t-2xl">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="absolute right-3 sm:right-4 top-3 sm:top-4 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors disabled:opacity-50 touch-manipulation"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 pr-12 sm:pr-16">
            <div className="p-2 sm:p-3 bg-white bg-opacity-20 rounded-xl flex-shrink-0">
              <ArrowDownTrayIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-2xl font-bold text-white leading-tight">
                {t('common.export.title')}
              </h2>
              <p className="text-primary-100 mt-1 text-xs sm:text-sm leading-relaxed">
                {t('common.export.subtitle', { count: reservationCount })} • {t(getStatusLabel())}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        {stats && Object.keys(stats).length > 0 && (
          <ExportStatsPreview stats={stats} reservationCount={reservationCount} />
        )}

        {/* Format selection */}
        <div className="px-4 sm:px-8 py-4 sm:py-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            {t('common.export.selectFormat')}
          </h3>

          <div className="space-y-2 sm:space-y-3">
            {formatOptions.map((format) => (
              <ExportFormatOption
                key={format.id}
                format={format}
                isSelected={selectedFormat === format.id}
                onSelect={setSelectedFormat}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-gray-50 rounded-b-2xl">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:justify-between">
            <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              {t('common.export.downloadNote')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleClose}
                disabled={isExporting}
                className="px-4 sm:px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 text-sm sm:text-base touch-manipulation"
              >
                {t('common.cancel')}
              </button>

              <button
                onClick={handleExport}
                disabled={!selectedFormat || isExporting}
                className={`px-4 sm:px-6 py-2.5 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:touch-manipulation ${
                  selectedFormat && !isExporting
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : 'bg-gray-400'
                }`}
              >
                {isExporting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t('common.export.exporting')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    {t('common.export.exportNow')}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

ExportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  reservationCount: PropTypes.number,
  filterStatus: PropTypes.string,
  stats: PropTypes.shape({
    totalReservations: PropTypes.number,
    totalTourists: PropTypes.number,
    totalRevenue: PropTypes.number,
    avgTicket: PropTypes.number
  })
};

export default ExportModal;