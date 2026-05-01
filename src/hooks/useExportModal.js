import { useState, useCallback, useMemo } from 'react';
import { DocumentTextIcon, DocumentIcon } from '@heroicons/react/24/outline';
import {
  EXPORT_FORMATS,
  FILE_EXTENSIONS,
  FORMAT_COLORS,
  EXPORT_RECOMMENDATIONS,
  EXPORT_TIMEOUTS,
  EXPORT_STATUS_KEYS
} from '../constants/exportConstants';

/**
 * Hook personalizado para gestionar modal de exportación
 * @param {number} reservationCount - Número de reservaciones a exportar
 * @param {string} filterStatus - Estado actual del filtro
 * @returns {Object} Estado y funciones para el modal de exportación
 */
const useExportModal = (reservationCount = 0, filterStatus = 'all') => {
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const formatOptions = [
    {
      id: 'excel',
      name: 'Excel',
      extension: '.xlsx',
      icon: DocumentTextIcon,
      color: 'from-green-500 to-green-600',
      descriptionKey: 'common.export.formats.excel.description',
      features: [
        'common.export.formats.excel.features.organized',
        'common.export.formats.excel.features.formulas',
        'common.export.formats.excel.features.charts'
      ],
      recommended: reservationCount > 20
    },
    {
      id: 'pdf',
      name: 'PDF',
      extension: '.pdf',
      icon: DocumentTextIcon,
      color: 'from-red-500 to-red-600',
      descriptionKey: 'common.export.formats.pdf.description',
      features: [
        'common.export.formats.pdf.features.professional',
        'common.export.formats.pdf.features.statistics',
        'common.export.formats.pdf.features.printReady'
      ],
      recommended: filterStatus !== 'all'
    }
  ];

  const getStatusLabel = () => {
    switch (filterStatus) {
      case 'all': return 'common.export.status.all';
      case 'pendiente': return 'common.export.status.pending';
      case 'confirmada': return 'common.export.status.confirmed';
      case 'cancelada': return 'common.export.status.cancelled';
      case 'completada': return 'common.export.status.completed';
      default: return 'common.export.status.filtered';
    }
  };

  const handleExport = async (onExport, onClose) => {
    if (!selectedFormat) return;
    
    setIsExporting(true);
    try {
      await onExport(selectedFormat);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
        setSelectedFormat(null);
      }, EXPORT_TIMEOUTS.PROCESS_DELAY);
    } catch (error) {
      setIsExporting(false);
      // Error manejado en el componente padre
    }
  };

  const resetSelection = () => {
    setSelectedFormat(null);
  };

  return {
    selectedFormat,
    setSelectedFormat,
    isExporting,
    formatOptions,
    getStatusLabel,
    handleExport,
    resetSelection
  };
};

export default useExportModal;