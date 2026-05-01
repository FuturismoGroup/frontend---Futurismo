import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '../../stores/authStore';
import useExportPanel from '../../hooks/useExportPanel';
import ExportStatusFilter from './ExportStatusFilter';
import ExportStatsPreview from './ExportStatsPreview';
import ExportFormatButtons from './ExportFormatButtons';

const ExportPanel = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const hideIncome = user?.role === 'agency';
  const {
    selectedStatus,
    setSelectedStatus,
    isExporting,
    statusOptions,
    exportFormats,
    handleExport,
    stats,
    getSelectedStatusLabel
  } = useExportPanel();

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:mb-6">
        <div className="p-2 bg-primary-100 rounded-lg self-start">
          <ArrowDownTrayIcon className="w-5 h-5 text-primary-600 sm:w-6 sm:h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
            {t('dashboard.export.title')}
          </h3>
          <p className="text-xs text-gray-600 sm:text-sm">
            {t('dashboard.export.subtitle')}
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <ExportStatusFilter
        statusOptions={statusOptions}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
      />

      {/* Stats Preview */}
      <ExportStatsPreview stats={stats} hideIncome={hideIncome} />

      {/* Export Format Buttons */}
      <ExportFormatButtons
        formats={exportFormats}
        onExport={handleExport}
        isExporting={isExporting}
        totalReservations={stats.totalReservations}
        selectedStatusLabel={getSelectedStatusLabel()}
      />

      {/* Info Note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg sm:mt-6">
        <p className="text-xs text-blue-800 sm:text-sm">
          <span className="font-medium">💡 {t('dashboard.export.tip')}:</span>{' '}
          <span className="hidden sm:inline">{t('dashboard.export.tipDescription')}</span>
          <span className="sm:hidden">{t('dashboard.export.tipDescription')?.substring(0, 50) + '...'}</span>
        </p>
      </div>
    </div>
  );
};

export default ExportPanel;