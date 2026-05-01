import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import exportService from '../services/exportService';
import useAuthStore from '../stores/authStore';
import toast from 'react-hot-toast';

const useExportPanel = () => {
  const user = useAuthStore((state) => state.user);
  const hideIncome = user?.role === 'agency';
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isExporting, setIsExporting] = useState(false);
  const [stats, setStats] = useState({
    totalReservations: 0,
    totalTourists: 0,
    totalRevenue: 0,
    avgTicket: 0
  });
  const { t } = useTranslation();

  const statusOptions = [
    {
      value: 'all',
      label: t('dashboard.export.statusOptions.all'),
      icon: ChartBarIcon,
      color: 'text-blue-600'
    },
    {
      value: 'pending',
      label: t('dashboard.export.statusOptions.pending'),
      icon: ClockIcon,
      color: 'text-yellow-600'
    },
    {
      value: 'confirmed',
      label: t('dashboard.export.statusOptions.confirmed'),
      icon: CheckCircleIcon,
      color: 'text-green-600'
    },
    {
      value: 'cancelled',
      label: t('dashboard.export.statusOptions.cancelled'),
      icon: XCircleIcon,
      color: 'text-red-600'
    }
  ];

  const exportFormats = [
    { 
      format: 'excel', 
      label: 'Excel', 
      icon: DocumentTextIcon, 
      color: 'bg-green-500 hover:bg-green-600',
      description: t('dashboard.export.formats.excel.description')
    },
    { 
      format: 'pdf', 
      label: 'PDF', 
      icon: DocumentTextIcon, 
      color: 'bg-red-500 hover:bg-red-600',
      description: t('dashboard.export.formats.pdf.description')
    }
  ];

  // Load statistics when selectedStatus changes
  useEffect(() => {
    const loadStats = async () => {
      try {
        const newStats = await exportService.getFilteredStats(selectedStatus);
        setStats(newStats);
      } catch (error) {
        console.error('Error loading stats:', error);
        setStats({
          totalReservations: 0,
          totalTourists: 0,
          totalRevenue: 0,
          avgTicket: 0
        });
      }
    };

    loadStats();
  }, [selectedStatus]);

  const handleExport = async (format) => {
    setIsExporting(true);
    try {
      // Get current filter statistics
      const currentStats = await exportService.getFilteredStats(selectedStatus);
      const statusLabel = statusOptions.find(opt => opt.value === selectedStatus)?.label || '';

      // Export with selected filter
      await exportService.exportData(format, selectedStatus, null, { hideIncome });

      // Show success message
      if (hideIncome) {
        toast.success(`✅ Exportación completada - ${currentStats.totalReservations} reservas, ${currentStats.totalTourists} turistas (${format.toUpperCase()})`);
      } else {
        toast.success(t('dashboard.export.success', {
          status: statusLabel,
          count: currentStats.totalReservations,
          tourists: currentStats.totalTourists,
          revenue: currentStats.totalRevenue.toLocaleString(),
          format: format.toUpperCase()
        }));
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('dashboard.export.error'));
    } finally {
      setIsExporting(false);
    }
  };

  const getSelectedStatusLabel = () => {
    return statusOptions.find(opt => opt.value === selectedStatus)?.label || '';
  };

  return {
    selectedStatus,
    setSelectedStatus,
    isExporting,
    statusOptions,
    exportFormats,
    handleExport,
    stats,
    getSelectedStatusLabel
  };
};

export default useExportPanel;