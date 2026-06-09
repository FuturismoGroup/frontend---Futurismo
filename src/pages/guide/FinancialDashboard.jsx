import React, { useState, useMemo, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  PlusIcon,
  MinusIcon,
  CalculatorIcon,
  ChartBarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxIcon,
  ClipboardDocumentListIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useFinancialStore } from '../../stores/financialStore';
import useAuthStore from '../../stores/authStore';
import { api } from '../../services';
import { financialService } from '../../services/financialService';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Convierte una fecha a string YYYY-MM-DD sin problemas de timezone
 * Usa componentes locales en lugar de toISOString() que convierte a UTC
 */
const toDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD
 */
const getTodayString = () => toDateString(new Date());

const FinancialDashboard = () => {
  const { t } = useTranslation();
  // Store hooks
  const {
    expenses,
    income,
    calculations,
    categories: expenseCategories,
    incomeTypes,
    financialStats,
    isLoading,
    isLoadingCalculations,
    error,
    expensePagination,
    incomePagination,
    calculationsPagination,
    initialize,
    createExpense,
    updateExpense,
    deleteExpense,
    createIncome,
    updateIncome,
    deleteIncome,
    saveCalculation,
    loadCalculations,
    deleteCalculation,
    setExpensePage,
    setIncomePage,
    setCalculationsPage
  } = useFinancialStore();

  const [activeTab, setActiveTab] = useState('dashboard');

  // Estados para la calculadora
  const [calculatorData, setCalculatorData] = useState({
    income: '',
    transportExpenses: '',
    foodExpenses: '',
    otherExpenses: ''
  });

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [incomeDetailModal, setIncomeDetailModal] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [availableTours, setAvailableTours] = useState([]);

  // Obtener fechas del mes actual
  const getCurrentMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: toDateString(firstDay),
      endDate: toDateString(lastDay)
    };
  };

  // Inicializar datos al montar el componente
  useEffect(() => {
    const user = useAuthStore.getState().user;
    // Usar guideId para guías freelance, id para otros casos
    const guideId = user?.guideId || user?.id;
    if (guideId) {
      initialize(guideId);
    }
  }, [initialize]);

  // Cargar tours disponibles
  useEffect(() => {
    const loadTours = async () => {
      try {
        const response = await api.get('/tours');
        // El endpoint /tours devuelve { data: [...], total, page, ... }
        const tours = response.data?.data || [];
        setAvailableTours(tours.filter(t => t.active !== false));
      } catch (error) {
        console.error('Error loading tours:', error);
      }
    };
    loadTours();
  }, []);

  // Cargar cálculos cuando se cambia al tab de historial
  useEffect(() => {
    if (activeTab === 'saved-calculations') {
      loadCalculations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  /**
   * Parsea un string "YYYY-MM-DD" a Date local sin desfase UTC.
   * Evita el problema de new Date("YYYY-MM-DD") que interpreta como UTC.
   */
  const parseDateString = (dateStr) => {
    if (!dateStr) return null;
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
  };

  // Calcular estadísticas del mes actual
  const localStats = useMemo(() => {
    const { startDate, endDate } = getCurrentMonthDates();
    const startDateObj = parseDateString(startDate);
    const endDateObj = parseDateString(endDate);
    endDateObj.setHours(23, 59, 59, 999);

    // Asegurar que income y expenses sean arrays
    const incomeArray = Array.isArray(income) ? income : [];
    const expensesArray = Array.isArray(expenses) ? expenses : [];
    const categoriesArray = Array.isArray(expenseCategories) ? expenseCategories : [];

    // Filtrar por mes actual
    const monthlyIncome = incomeArray.filter(item => {
      const itemDate = parseDateString(item.date);
      return itemDate >= startDateObj && itemDate <= endDateObj;
    });

    const monthlyExpenses = expensesArray.filter(item => {
      const itemDate = parseDateString(item.date);
      return itemDate >= startDateObj && itemDate <= endDateObj;
    });

    const totalIncome = monthlyIncome.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const totalExpenses = monthlyExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;

    // Gastos por categoría (solo del mes)
    const expensesByCategory = monthlyExpenses.reduce((acc, expense) => {
      const category = categoriesArray.find(cat => cat.value === expense.category);
      const categoryName = category?.label || expense.categoryName || 'Otros';
      acc[categoryName] = (acc[categoryName] || 0) + (parseFloat(expense.amount) || 0);
      return acc;
    }, {});

    // Contar servicios realizados (tours + servicios marketplace)
    const serviceTypes = ['guided_tour', 'private_tour', 'tour', 'marketplace_freelance'];
    const toursCount = monthlyIncome.filter(i => serviceTypes.includes(i.type)).length;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      profitMargin: parseFloat(profitMargin),
      expensesByCategory,
      toursCount,
      monthlyIncome,
      monthlyExpenses
    };
  }, [income, expenses, expenseCategories]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  /**
   * Formatea una fecha tipo "YYYY-MM-DD" para mostrar en UI.
   * IMPORTANTE: Las fechas sin hora (tipo DATE en DB) se parsean como UTC.
   * Para evitar desfases por zona horaria, parseamos los componentes manualmente.
   */
  const formatDate = (dateString) => {
    if (!dateString) return '';

    // Si es string tipo "YYYY-MM-DD", parsear componentes para evitar desfase UTC
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-').map(Number);
      // Crear fecha usando componentes locales (no UTC)
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }

    // Para otros formatos (ISO con hora), usar el parseo normal
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Funciones para la calculadora
  const handleCalculatorChange = (field, value) => {
    setCalculatorData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Cálculos dinámicos de la calculadora
  const calculatorResults = useMemo(() => {
    const incomeVal = parseFloat(calculatorData.income) || 0;
    const transportExpenses = parseFloat(calculatorData.transportExpenses) || 0;
    const foodExpenses = parseFloat(calculatorData.foodExpenses) || 0;
    const otherExpenses = parseFloat(calculatorData.otherExpenses) || 0;

    const totalExpenses = transportExpenses + foodExpenses + otherExpenses;
    const netProfit = incomeVal - totalExpenses;
    const profitMargin = incomeVal > 0 ? ((netProfit / incomeVal) * 100).toFixed(1) : 0;

    return {
      income: incomeVal,
      totalExpenses,
      netProfit,
      profitMargin: parseFloat(profitMargin),
      transportExpenses,
      foodExpenses,
      otherExpenses
    };
  }, [calculatorData]);

  // Función para guardar el cálculo como transacciones
  const saveCalculationAsTransactions = async () => {
    if (calculatorResults.income <= 0) {
      toast.error(t('financial.invalidAmount'));
      return;
    }

    try {
      const user = useAuthStore.getState().user;
      // Usar guideId para guías freelance, id para otros casos
      const guideId = user?.guideId || user?.id;

      // Enviar en formato compatible con el backend
      await saveCalculation({
        guideId,
        tourPrice: calculatorResults.income,
        participants: 1,
        guideCommission: 100,
        estimatedExpenses: calculatorResults.totalExpenses,
        grossIncome: calculatorResults.income,
        netIncome: calculatorResults.netProfit,
        profitMargin: calculatorResults.profitMargin,
        notes: `Cálculo de tour - Transporte: S/${calculatorResults.transportExpenses}, Alimentación: S/${calculatorResults.foodExpenses}, Otros: S/${calculatorResults.otherExpenses}`
      });

      // Limpiar calculadora y cambiar a tab de Historial (donde se listan los calculos guardados)
      setCalculatorData({
        income: '',
        transportExpenses: '',
        foodExpenses: '',
        otherExpenses: ''
      });

      setActiveTab('saved-calculations');
      toast.success(t('financial.calculationSaved'));
    } catch (error) {
      toast.error(t('financial.calculationSaveError'));
      console.error('Error:', error);
    }
  };

  // Mostrar resumen con toast en lugar de alert
  const showCalculatorSummary = () => {
    if (calculatorResults.income > 0) {
      toast.success(
        `Rentabilidad: ${calculatorResults.profitMargin}% de margen\nGanancia neta: ${formatCurrency(calculatorResults.netProfit)}`,
        { duration: 4000 }
      );
    } else {
      toast.error(t('financial.invalidAmount'));
    }
  };

  // Cargar TODOS los ingresos y gastos del mes (sin límite de paginación)
  const fetchAllMonthData = async () => {
    const user = useAuthStore.getState().user;
    const guideId = user?.guideId || user?.id;
    const { startDate, endDate } = getCurrentMonthDates();

    const [incomeRes, expensesRes] = await Promise.all([
      financialService.getIncome({ guideId, startDate, endDate, limit: 9999, page: 1 }),
      financialService.getExpenses({ guideId, startDate, endDate, limit: 9999, page: 1 })
    ]);

    return {
      allIncome: incomeRes.success ? (incomeRes.data || []) : [],
      allExpenses: expensesRes.success ? (expensesRes.data || []) : []
    };
  };

  // Preparar datos para exportación (recibe datos completos del API)
  const buildExportData = (allIncome, allExpenses) => {
    const incomeRows = allIncome.map(item => ({
      tipo: 'Ingreso',
      fecha: formatDate(item.date),
      descripcion: item.description || item.typeName || item.type || '',
      categoria: item.typeName || item.type || '',
      monto: parseFloat(item.amount) || 0
    }));
    const expenseRows = allExpenses.map(item => {
      const cat = getCategoryInfoLocal(item.category);
      return {
        tipo: 'Gasto',
        fecha: formatDate(item.date),
        descripcion: item.description || '',
        categoria: cat.label,
        monto: -(parseFloat(item.amount) || 0)
      };
    });
    return [...incomeRows, ...expenseRows].sort((a, b) => {
      const da = new Date(a.fecha.split('/').reverse().join('-'));
      const db = new Date(b.fecha.split('/').reverse().join('-'));
      return da - db;
    });
  };

  // Exportar a Excel
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const { allIncome, allExpenses } = await fetchAllMonthData();
      const rows = buildExportData(allIncome, allExpenses);
      if (rows.length === 0) {
        toast.error('No hay datos para exportar este mes');
        setIsExporting(false);
        return;
      }

      // Recalcular totales con TODOS los datos
      const totalIncome = allIncome.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const totalExpenses = allExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;
      const serviceTypes = ['guided_tour', 'private_tour', 'tour', 'marketplace_freelance'];
      const toursCount = allIncome.filter(i => serviceTypes.includes(i.type)).length;
      const expensesByCategory = allExpenses.reduce((acc, expense) => {
        const category = (expenseCategories || []).find(cat => cat.value === expense.category);
        const categoryName = category?.label || expense.categoryName || 'Otros';
        acc[categoryName] = (acc[categoryName] || 0) + (parseFloat(expense.amount) || 0);
        return acc;
      }, {});

      // Hoja de transacciones
      const wsData = [
        [t('financial.type'), t('financial.date'), t('financial.description'), t('financial.category'), t('financial.amountSoles')],
        ...rows.map(r => [r.tipo, r.fecha, r.descripcion, r.categoria, r.monto])
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      // Anchos de columna
      ws['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 30 }, { wch: 20 }, { wch: 14 }];

      // Hoja de resumen
      const summaryData = [
        ['Reporte Financiero', ''],
        ['Período', `${getCurrentMonthDates().startDate} a ${getCurrentMonthDates().endDate}`],
        ['', ''],
        ['Total Ingresos', totalIncome],
        ['Total Gastos', totalExpenses],
        ['Ganancia Neta', netProfit],
        ['Margen de Ganancia', `${profitMargin}%`],
        ['Servicios Realizados', toursCount],
        ['', ''],
        [t('financial.expensesByCategory'), ''],
        ...Object.entries(expensesByCategory || {}).map(([cat, amount]) => [cat, amount])
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 25 }, { wch: 18 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen');
      XLSX.utils.book_append_sheet(wb, ws, 'Transacciones');
      XLSX.writeFile(wb, `reporte-financiero-${getTodayString()}.xlsx`);

      toast.success('Reporte Excel exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar el reporte');
      console.error('Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar a PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const { allIncome, allExpenses } = await fetchAllMonthData();
      const rows = buildExportData(allIncome, allExpenses);
      if (rows.length === 0) {
        toast.error('No hay datos para exportar este mes');
        setIsExporting(false);
        return;
      }

      // Recalcular totales con TODOS los datos
      const totalIncome = allIncome.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const totalExpenses = allExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0;
      const serviceTypes = ['guided_tour', 'private_tour', 'tour', 'marketplace_freelance'];
      const toursCount = allIncome.filter(i => serviceTypes.includes(i.type)).length;
      const expensesByCategory = allExpenses.reduce((acc, expense) => {
        const category = (expenseCategories || []).find(cat => cat.value === expense.category);
        const categoryName = category?.label || expense.categoryName || 'Otros';
        acc[categoryName] = (acc[categoryName] || 0) + (parseFloat(expense.amount) || 0);
        return acc;
      }, {});

      const doc = new jsPDF();
      const { startDate, endDate } = getCurrentMonthDates();

      // Título
      doc.setFontSize(16);
      doc.text('Reporte Financiero', 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Período: ${startDate} a ${endDate}`, 14, 28);

      // Resumen
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text('Resumen', 14, 40);

      autoTable(doc, {
        startY: 44,
        head: [['Concepto', 'Valor']],
        body: [
          ['Total Ingresos', formatCurrency(totalIncome)],
          ['Total Gastos', formatCurrency(totalExpenses)],
          ['Ganancia Neta', formatCurrency(netProfit)],
          ['Margen de Ganancia', `${profitMargin}%`],
          ['Servicios Realizados', String(toursCount)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 9 }
      });

      // Gastos por categoría
      const catEntries = Object.entries(expensesByCategory || {});
      if (catEntries.length > 0) {
        const catY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text(t('financial.expensesByCategory'), 14, catY);

        autoTable(doc, {
          startY: catY + 4,
          head: [[t('financial.category'), t('financial.amount')]],
          body: catEntries.map(([cat, amount]) => [cat, formatCurrency(amount)]),
          theme: 'grid',
          headStyles: { fillColor: [220, 38, 38] },
          styles: { fontSize: 9 }
        });
      }

      // Transacciones
      const transY = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Detalle de Transacciones', 14, transY);

      autoTable(doc, {
        startY: transY + 4,
        head: [[t('financial.type'), t('financial.date'), t('financial.description'), t('financial.category'), t('financial.amount')]],
        body: rows.map(r => [r.tipo, r.fecha, r.descripcion, r.categoria, formatCurrency(r.monto)]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 },
        columnStyles: { 4: { halign: 'right' } }
      });

      doc.save(`reporte-financiero-${getTodayString()}.pdf`);
      toast.success('Reporte PDF exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar el reporte');
      console.error('Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Obtener info de categoría con fallback seguro
  const getCategoryInfoLocal = (categoryValue) => {
    if (!expenseCategories || expenseCategories.length === 0) {
      return { label: 'Otros', icon: '📦', color: 'gray' };
    }
    const category = expenseCategories.find(cat => cat.value === categoryValue);
    return category || { label: 'Otros', icon: '📦', color: 'gray' };
  };

  // Mapeo de iconos de string a emoji
  const iconMap = {
    'truck': '🚗',
    'utensils': '🍽️',
    'box': '📦',
    'briefcase': '💼',
    'phone': '📱',
    'wrench': '🔧',
    'shield': '🛡️',
    'ellipsis': '📋',
    'map': '🗺️',
    'gift': '🎁',
    'star': '⭐',
    'plus-circle': '➕',
    'percent': '💰',
    'refresh': '🔄'
  };

  const getIconEmoji = (iconName) => {
    return iconMap[iconName] || '📋';
  };

  // Colores para categorías basados en el color hex
  const getColorClasses = (hexColor) => {
    const colorMap = {
      '#3B82F6': { bg: 'bg-blue-100', text: 'text-blue-800' },
      '#10B981': { bg: 'bg-green-100', text: 'text-green-800' },
      '#F59E0B': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      '#8B5CF6': { bg: 'bg-purple-100', text: 'text-purple-800' },
      '#EC4899': { bg: 'bg-pink-100', text: 'text-pink-800' },
      '#6B7280': { bg: 'bg-gray-100', text: 'text-gray-800' },
      '#14B8A6': { bg: 'bg-teal-100', text: 'text-teal-800' },
      '#9CA3AF': { bg: 'bg-gray-100', text: 'text-gray-800' }
    };
    return colorMap[hexColor] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  // Componente StatCard con colores estáticos
  const StatCard = ({ title, value, subtitle, icon: Icon, colorType = "blue", trend = null }) => {
    const colorStyles = {
      blue: { border: 'border-blue-500', icon: 'text-blue-600' },
      green: { border: 'border-green-500', icon: 'text-green-600' },
      red: { border: 'border-red-500', icon: 'text-red-600' },
      yellow: { border: 'border-yellow-500', icon: 'text-yellow-600' }
    };

    const colors = colorStyles[colorType] || colorStyles.blue;

    return (
      <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            {trend !== null && trend !== undefined && (
              <div className={`flex items-center mt-1 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend > 0 ? <ArrowTrendingUpIcon className="w-4 h-4 mr-1" /> : <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />}
                <span className="text-xs font-medium">{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
          <Icon className={`w-8 h-8 ${colors.icon}`} />
        </div>
      </div>
    );
  };

  // Componente EmptyState
  const EmptyState = ({ message, icon: Icon = InboxIcon }) => (
    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
      <Icon className="w-12 h-12 mb-4 text-gray-300" />
      <p className="text-sm">{message}</p>
    </div>
  );

  // Componente Pagination
  const Pagination = ({ pagination, onPageChange }) => {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onPageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <span className="px-3 py-2 text-sm">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Componente SavedCalculationsTab - Historial de cálculos guardados
  const SavedCalculationsTab = ({
    calculations,
    pagination,
    isLoading,
    onDeleteCalculation,
    onPageChange,
    onGoToCalculator,
    formatCurrency,
    formatDate
  }) => {
    const [deletingId, setDeletingId] = useState(null);
    const [detailsModal, setDetailsModal] = useState(null);

    const handleDelete = async (id) => {
      if (!window.confirm(t('financial.confirmDeleteCalculation'))) return;

      setDeletingId(id);
      try {
        await onDeleteCalculation(id);
        toast.success(t('financial.calculationDeleted'));
      } catch (error) {
        toast.error(t('financial.calculationDeleteError'));
      } finally {
        setDeletingId(null);
      }
    };

    const calculationsArray = Array.isArray(calculations) ? calculations : [];

    return (
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Historial de Cálculos</h3>
              <p className="text-sm text-gray-500 mt-1">
                Proyecciones de rentabilidad guardadas desde la calculadora
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <ClipboardDocumentListIcon className="w-5 h-5" />
              <span>{pagination?.total || 0} cálculos</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading && calculationsArray.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : calculationsArray.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <ClipboardDocumentListIcon className="w-16 h-16 mb-4 text-gray-300" />
            <h4 className="text-lg font-medium text-gray-700 mb-2">No hay cálculos guardados</h4>
            <p className="text-sm text-gray-500 text-center max-w-md">
              Usa la calculadora para simular la rentabilidad de tus tours y guarda los cálculos para consultarlos después.
            </p>
            <button
              onClick={onGoToCalculator}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir a la Calculadora
            </button>
          </div>
        ) : (
          <>
            {/* Lista de cálculos */}
            <div className="divide-y divide-gray-100">
              {calculationsArray.map((calc) => (
                <div
                  key={calc.id}
                  className="p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm text-gray-500">
                          {formatDate(calc.createdAt)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          calc.profitMargin >= 50
                            ? 'bg-green-100 text-green-700'
                            : calc.profitMargin >= 30
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {calc.profitMargin}% margen
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500">Ingreso Bruto</p>
                          <p className="text-sm font-semibold text-green-600">
                            {formatCurrency(calc.grossIncome)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Gastos Est.</p>
                          <p className="text-sm font-semibold text-red-600">
                            {formatCurrency(calc.estimatedExpenses)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Ganancia Neta</p>
                          <p className={`text-sm font-semibold ${
                            calc.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(calc.netIncome)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Participantes</p>
                          <p className="text-sm font-semibold text-gray-700">
                            {calc.participants}
                          </p>
                        </div>
                      </div>

                      {calc.notes && (
                        <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          {calc.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setDetailsModal(calc)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(calc.id)}
                        disabled={deletingId === calc.id}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Eliminar"
                      >
                        {deletingId === calc.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <TrashIcon className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            <Pagination pagination={pagination} onPageChange={onPageChange} />
          </>
        )}

        {/* Modal de detalles */}
        {detailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Detalles del Cálculo</h3>
                <button
                  onClick={() => setDetailsModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">{t('financial.date')}</span>
                  <span className="font-medium">{formatDate(detailsModal.createdAt)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Precio del Tour</span>
                  <span className="font-medium text-green-600">{formatCurrency(detailsModal.tourPrice)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Participantes</span>
                  <span className="font-medium">{detailsModal.participants}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Comisión Guía</span>
                  <span className="font-medium">{detailsModal.guideCommission}%</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Ingreso Bruto</span>
                  <span className="font-medium text-green-600">{formatCurrency(detailsModal.grossIncome)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Gastos Estimados</span>
                  <span className="font-medium text-red-600">{formatCurrency(detailsModal.estimatedExpenses)}</span>
                </div>
                <div className="flex justify-between py-2 border-b bg-blue-50 -mx-2 px-2 rounded">
                  <span className="font-semibold text-gray-700">Ganancia Neta</span>
                  <span className={`font-bold ${detailsModal.netIncome >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    {formatCurrency(detailsModal.netIncome)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Margen de Rentabilidad</span>
                  <span className={`font-bold ${
                    detailsModal.profitMargin >= 50
                      ? 'text-green-600'
                      : detailsModal.profitMargin >= 30
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}>
                    {detailsModal.profitMargin}%
                  </span>
                </div>

                {detailsModal.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Notas:</p>
                    <p className="text-sm text-gray-700">{detailsModal.notes}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setDetailsModal(null)}
                className="w-full mt-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ExpenseForm = ({ onClose, item = null }) => {
    // Determinar si el item existente tiene un tour UUID válido o es texto libre
    const isValidUUID = (str) => {
      if (!str) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    const initialTourMode = item?.tourId
      ? (isValidUUID(item.tourId) ? 'select' : 'custom')
      : 'select';

    const defaultCategory = expenseCategories?.[0]?.value || 'otros';
    const [formData, setFormData] = useState({
      category: item?.category || defaultCategory,
      description: item?.description || '',
      amount: item?.amount || '',
      date: item?.date || getTodayString(),
      tourId: item?.tourId || '',
      tourName: item?.tourName || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tourMode, setTourMode] = useState(initialTourMode);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        if (item) {
          await updateExpense(item.id, formData);
          toast.success('Gasto actualizado exitosamente');
        } else {
          await createExpense(formData);
          toast.success('Gasto registrado exitosamente');
        }
        onClose();
      } catch (error) {
        toast.error(error?.message || 'Error al guardar el gasto');
        console.error('Error:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {item ? t('financial.editExpense') : t('financial.registerExpense')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('financial.category')}
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
              >
                {expenseCategories && expenseCategories.length > 0 ? (
                  expenseCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {getIconEmoji(cat.icon)} {cat.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="transport">🚗 Transporte</option>
                    <option value="food">🍽️ Alimentación</option>
                    <option value="materials">📦 Materiales</option>
                    <option value="other">📋 Otros</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('financial.description')}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Gasolina para tour..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('financial.amount')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">S/</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('financial.date')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('financial.associatedTourOptional')}
              </label>
              <select
                value={tourMode === 'select' ? formData.tourId : '__custom__'}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setTourMode('custom');
                    setFormData({...formData, tourId: '', tourName: ''});
                  } else {
                    setTourMode('select');
                    const selectedTour = availableTours.find(t => t.id === e.target.value);
                    setFormData({
                      ...formData,
                      tourId: e.target.value,
                      tourName: selectedTour?.name || ''
                    });
                  }
                }}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Sin tour asociado --</option>
                {availableTours.map(tour => (
                  <option key={tour.id} value={tour.id}>
                    {tour.name}
                  </option>
                ))}
                <option value="__custom__">✏️ Escribir nombre personalizado</option>
              </select>
              {tourMode === 'custom' && (
                <input
                  type="text"
                  value={formData.tourName}
                  onChange={(e) => setFormData({...formData, tourName: e.target.value, tourId: ''})}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 mt-2"
                  placeholder="Nombre del tour personalizado"
                />
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-2 px-4 rounded-md text-white transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Guardando...' : (item ? 'Actualizar' : 'Registrar')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const IncomeForm = ({ onClose, item = null }) => {
    // Determinar si el item existente tiene un tour UUID válido o es texto libre
    const isValidUUID = (str) => {
      if (!str) return false;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    const initialTourMode = item?.tourId
      ? (isValidUUID(item.tourId) ? 'select' : 'custom')
      : 'select';

    const [formData, setFormData] = useState({
      description: item?.description || '',
      amount: item?.amount || '',
      date: item?.date || getTodayString(),
      tourId: item?.tourId || '',
      tourName: item?.tourName || '',
      type: item?.type || 'guided_tour'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [tourMode, setTourMode] = useState(initialTourMode); // 'select' o 'custom'

    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        if (item) {
          await updateIncome(item.id, formData);
          toast.success('Ingreso actualizado exitosamente');
        } else {
          await createIncome(formData);
          toast.success('Ingreso registrado exitosamente');
        }
        onClose();
      } catch (error) {
        toast.error('Error al guardar el ingreso');
        console.error('Error:', error);
      } finally {
        setIsSubmitting(false);
      }
    };

    // Determinar si el tipo seleccionado requiere tour
    const requiresTour = ['guided_tour', 'private_tour'].includes(formData.type);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">
            {item ? t('financial.editIncome') : t('financial.registerIncome')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('financial.incomeType')}
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {incomeTypes && incomeTypes.length > 0 ? (
                  incomeTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {getIconEmoji(type.icon)} {type.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="guided_tour">🗺️ Tour Guiado</option>
                    <option value="private_tour">⭐ Tour Privado</option>
                    <option value="tip">🎁 Propina</option>
                    <option value="commission">💰 Comisión</option>
                    <option value="extra_service">➕ Servicio Extra</option>
                    <option value="other">📋 Otros</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('financial.description')}
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Ej: Tour Cusco - Cliente ABC..."
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('financial.amount')}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">S/</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('financial.date')}
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('financial.associatedTour')} {requiresTour ? '*' : `(${t('financial.optional')})`}
              </label>
              <select
                value={tourMode === 'select' ? formData.tourId : '__custom__'}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setTourMode('custom');
                    setFormData({...formData, tourId: '', tourName: ''});
                  } else {
                    setTourMode('select');
                    const selectedTour = availableTours.find(t => t.id === e.target.value);
                    setFormData({
                      ...formData,
                      tourId: e.target.value,
                      tourName: selectedTour?.name || ''
                    });
                  }
                }}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                required={requiresTour && tourMode === 'select'}
              >
                <option value="">-- Seleccionar tour --</option>
                {availableTours.map(tour => (
                  <option key={tour.id} value={tour.id}>
                    {tour.name}
                  </option>
                ))}
                <option value="__custom__">✏️ Escribir nombre personalizado</option>
              </select>
              {tourMode === 'custom' && (
                <input
                  type="text"
                  value={formData.tourName}
                  onChange={(e) => setFormData({...formData, tourName: e.target.value, tourId: ''})}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 mt-2"
                  placeholder="Nombre del tour personalizado"
                  required={requiresTour}
                />
              )}
              {!requiresTour && (
                <p className="text-xs text-gray-500 mt-1">
                  No requerido para {incomeTypes?.find(t => t.value === formData.type)?.label || 'este tipo de ingreso'}
                </p>
              )}
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-2 px-4 rounded-md text-white transition-colors ${
                  isSubmitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {isSubmitting ? 'Guardando...' : (item ? 'Actualizar' : 'Registrar')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Mostrar loading o error
  if (isLoading && expenses.length === 0 && income.length === 0) {
    return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh] p-4">
            <div className="text-center">
              {error ? (
                <>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl">⚠</span>
                  </div>
                  <p className="text-red-600 font-medium">Error al cargar datos financieros</p>
                  <p className="mt-2 text-gray-600 text-sm break-words max-w-md mx-auto">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </>
              ) : (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-sm sm:text-base text-gray-600">Cargando datos financieros...</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                Control Financiero
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                Gestiona tus ingresos y gastos como guía freelance
              </p>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowIncomeForm(true)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Registrar </span>Ingreso
              </button>
              <button
                onClick={() => setShowExpenseForm(true)}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm whitespace-nowrap"
              >
                <MinusIcon className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Registrar </span>Gasto
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-4 sm:mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-4 sm:gap-6 lg:gap-8 px-3 sm:px-4 lg:px-6 overflow-x-auto">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: ChartBarIcon },
                { id: 'calculator', label: 'Calculadora', icon: CalculatorIcon },
                { id: 'saved-calculations', label: 'Historial', icon: ClipboardDocumentListIcon },
                { id: 'transactions', label: 'Transacciones', icon: BanknotesIcon },
                { id: 'reports', label: 'Reportes', icon: DocumentArrowDownIcon }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
              <StatCard
                title="Ingresos Totales"
                value={formatCurrency(localStats.totalIncome)}
                subtitle="Este mes"
                icon={ArrowTrendingUpIcon}
                colorType="green"
              />
              <StatCard
                title="Gastos Totales"
                value={formatCurrency(localStats.totalExpenses)}
                subtitle="Este mes"
                icon={ArrowTrendingDownIcon}
                colorType="red"
              />
              <StatCard
                title="Ganancia Neta"
                value={formatCurrency(localStats.netProfit)}
                subtitle={`Margen: ${localStats.profitMargin}%`}
                icon={CurrencyDollarIcon}
                colorType={localStats.netProfit >= 0 ? "green" : "red"}
              />
              <StatCard
                title="Servicios Realizados"
                value={localStats.toursCount || 0}
                subtitle="Este mes"
                icon={CalendarIcon}
                colorType="blue"
              />
            </div>

            {/* Gastos por Categoría */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {t('financial.expensesByCategory')}
              </h3>
              {Object.keys(localStats.expensesByCategory || {}).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(localStats.expensesByCategory).map(([category, amount]) => {
                    const categoryInfo = expenseCategories?.find(cat => cat.label === category);
                    const colorClasses = categoryInfo ? getColorClasses(categoryInfo.color) : { bg: 'bg-gray-100', text: 'text-gray-800' };
                    return (
                      <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClasses.bg}`}>
                            {categoryInfo ? getIconEmoji(categoryInfo.icon) : '📋'}
                          </span>
                          <span className="text-sm font-medium text-gray-700">{category}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState message="No hay gastos registrados este mes" />
              )}
            </div>
          </div>
        )}

        {activeTab === 'calculator' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Calculadora de Rentabilidad por Tour
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ingreso del Tour
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">S/</span>
                    <input
                      type="number"
                      value={calculatorData.income}
                      onChange={(e) => handleCalculatorChange('income', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="680"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gastos de Transporte
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">S/</span>
                    <input
                      type="number"
                      value={calculatorData.transportExpenses}
                      onChange={(e) => handleCalculatorChange('transportExpenses', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="120"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gastos de Alimentación
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">S/</span>
                    <input
                      type="number"
                      value={calculatorData.foodExpenses}
                      onChange={(e) => handleCalculatorChange('foodExpenses', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="85"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Otros Gastos
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">S/</span>
                    <input
                      type="number"
                      value={calculatorData.otherExpenses}
                      onChange={(e) => handleCalculatorChange('otherExpenses', e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                      placeholder="45"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button
                      onClick={() => setCalculatorData({
                        income: '',
                        transportExpenses: '',
                        foodExpenses: '',
                        otherExpenses: ''
                      })}
                      className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={showCalculatorSummary}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Ver Resumen
                    </button>
                  </div>
                  <button
                    onClick={saveCalculationAsTransactions}
                    disabled={calculatorResults.income <= 0}
                    className={`w-full py-2 px-4 rounded-md transition-colors ${
                      calculatorResults.income > 0
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    💾 Guardar Cálculo
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="font-semibold text-gray-800">Resumen del Cálculo</h4>
                  {calculatorResults.income > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      calculatorResults.netProfit >= 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {calculatorResults.netProfit >= 0 ? t('financial.profitable') : t('financial.atLoss')}
                    </span>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ingresos:</span>
                    <span className="font-medium">
                      {calculatorResults.income > 0 ? formatCurrency(calculatorResults.income) : 'S/ 0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gastos Totales:</span>
                    <span className="font-medium">
                      {calculatorResults.totalExpenses > 0 ? formatCurrency(calculatorResults.totalExpenses) : 'S/ 0.00'}
                    </span>
                  </div>
                  <hr className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Ganancia Neta:</span>
                    <span className={`${calculatorResults.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(calculatorResults.netProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Margen de Ganancia:</span>
                    <span className={`font-medium ${calculatorResults.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {calculatorResults.profitMargin}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Ingresos */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Ingresos Recientes</h3>
                <button
                  onClick={() => setShowIncomeForm(true)}
                  className="text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  + Agregar Ingreso
                </button>
              </div>
              {income && income.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-3">{t('financial.date')}</th>
                          <th className="px-4 py-3">{t('financial.type')}</th>
                          <th className="px-4 py-3">{t('financial.description')}</th>
                          <th className="px-4 py-3">{t('financial.origin')}</th>
                          <th className="px-4 py-3">{t('financial.amount')}</th>
                          <th className="px-4 py-3">{t('financial.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {income.map(item => {
                          const typeInfo = incomeTypes?.find(t => t.value === item.type);
                          const isMarketplaceIncome = item.type === 'marketplace_freelance' || !!item.serviceRequestId;
                          return (
                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-4 py-3">{formatDate(item.date)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                                  isMarketplaceIncome
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {typeInfo ? getIconEmoji(typeInfo.icon) : '📋'} {item.typeName || typeInfo?.label || item.type}
                                </span>
                              </td>
                              <td className="px-4 py-3">{item.description}</td>
                              <td className="px-4 py-3">
                                {item.tourId || item.tourName ? (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                    {item.tourName || item.tourId}
                                  </span>
                                ) : item.source ? (
                                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                                    {item.source}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-medium text-green-600">
                                {formatCurrency(item.amount)}
                              </td>
                              <td className="px-4 py-3">
                                {isMarketplaceIncome ? (
                                  <button
                                    onClick={() => setIncomeDetailModal(item)}
                                    className="text-purple-600 hover:text-purple-800"
                                    title="Ver detalle"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingItem(item);
                                        setShowIncomeForm(true);
                                      }}
                                      className="text-blue-600 hover:text-blue-800"
                                      title="Editar"
                                    >
                                      <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={async () => {
                                        if (confirm(t('financial.confirmDeleteIncome'))) {
                                          try {
                                            await deleteIncome(item.id);
                                            toast.success('Ingreso eliminado exitosamente');
                                          } catch (error) {
                                            toast.error('Error al eliminar el ingreso');
                                          }
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-800"
                                      title="Eliminar"
                                    >
                                      <TrashIcon className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    pagination={incomePagination}
                    onPageChange={setIncomePage}
                  />
                </>
              ) : (
                <EmptyState message="No hay ingresos registrados" />
              )}
            </div>

            {/* Gastos */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Gastos Recientes</h3>
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  + Agregar Gasto
                </button>
              </div>
              {expenses && expenses.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-3">{t('financial.date')}</th>
                          <th className="px-4 py-3">{t('financial.category')}</th>
                          <th className="px-4 py-3">{t('financial.description')}</th>
                          <th className="px-4 py-3">Tour</th>
                          <th className="px-4 py-3">{t('financial.amount')}</th>
                          <th className="px-4 py-3">{t('financial.actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map(expense => {
                          const categoryInfo = expenseCategories?.find(cat => cat.value === expense.category);
                          const colorClasses = categoryInfo ? getColorClasses(categoryInfo.color) : { bg: 'bg-gray-100', text: 'text-gray-800' };
                          return (
                            <tr key={expense.id} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-4 py-3">{formatDate(expense.date)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${colorClasses.bg} ${colorClasses.text}`}>
                                  {categoryInfo ? getIconEmoji(categoryInfo.icon) : '📋'} {expense.categoryName || categoryInfo?.label || expense.category}
                                </span>
                              </td>
                              <td className="px-4 py-3">{expense.description}</td>
                              <td className="px-4 py-3">
                                {expense.tourId || expense.tourName ? (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                    {expense.tourName || expense.tourId}
                                  </span>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-medium text-red-600">
                                {formatCurrency(expense.amount)}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingItem(expense);
                                      setShowExpenseForm(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Editar"
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (confirm(t('financial.confirmDeleteExpense'))) {
                                        try {
                                          await deleteExpense(expense.id);
                                          toast.success('Gasto eliminado exitosamente');
                                        } catch (error) {
                                          toast.error('Error al eliminar el gasto');
                                        }
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800"
                                    title="Eliminar"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    pagination={expensePagination}
                    onPageChange={setExpensePage}
                  />
                </>
              ) : (
                <EmptyState message="No hay gastos registrados" />
              )}
            </div>
          </div>
        )}

        {/* Tab: Historial de Cálculos */}
        {activeTab === 'saved-calculations' && (
          <SavedCalculationsTab
            calculations={calculations}
            pagination={calculationsPagination}
            isLoading={isLoadingCalculations}
            onDeleteCalculation={deleteCalculation}
            onPageChange={setCalculationsPage}
            onGoToCalculator={() => setActiveTab('calculator')}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Reportes Financieros - Este Mes</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isExporting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } text-white`}
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  {isExporting ? 'Exportando...' : 'Excel'}
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isExporting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white`}
                >
                  <DocumentArrowDownIcon className="w-4 h-4" />
                  {isExporting ? 'Exportando...' : 'PDF'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Resumen Mensual</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span>Total de Ingresos:</span>
                    <span className="font-medium text-green-600">{formatCurrency(localStats.totalIncome)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Total de Gastos:</span>
                    <span className="font-medium text-red-600">{formatCurrency(localStats.totalExpenses)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b font-bold">
                    <span>Ganancia Neta:</span>
                    <span className={localStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(localStats.netProfit)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Margen de Ganancia:</span>
                    <span className="font-medium">{localStats.profitMargin}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-3">Métricas de Rendimiento</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span>Servicios Realizados:</span>
                    <span className="font-medium">{localStats.toursCount}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Ingreso Promedio por Servicio:</span>
                    <span className="font-medium">
                      {formatCurrency(localStats.toursCount > 0 ? localStats.totalIncome / localStats.toursCount : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span>Gasto Promedio por Servicio:</span>
                    <span className="font-medium">
                      {formatCurrency(localStats.toursCount > 0 ? localStats.totalExpenses / localStats.toursCount : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span>Ganancia Promedio por Servicio:</span>
                    <span className="font-medium">
                      {formatCurrency(localStats.toursCount > 0 ? localStats.netProfit / localStats.toursCount : 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forms */}
        {showExpenseForm && (
          <ExpenseForm
            onClose={() => {
              setShowExpenseForm(false);
              setEditingItem(null);
            }}
            item={editingItem}
          />
        )}

        {showIncomeForm && (
          <IncomeForm
            onClose={() => {
              setShowIncomeForm(false);
              setEditingItem(null);
            }}
            item={editingItem}
          />
        )}

        {/* Modal detalle de ingreso marketplace */}
        {incomeDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Detalle del Ingreso</h3>
                <button
                  onClick={() => setIncomeDetailModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-4">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {(() => {
                    const typeInfo = incomeTypes?.find(t => t.value === incomeDetailModal.type);
                    return <>{typeInfo ? getIconEmoji(typeInfo.icon) : '💼'} {incomeDetailModal.typeName || typeInfo?.label || 'Servicio Marketplace'}</>;
                  })()}
                </span>
                <span className="ml-2 text-xs text-gray-500">Generado automáticamente</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">{t('financial.date')}</span>
                  <span className="font-medium">{formatDate(incomeDetailModal.date)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">{t('financial.description')}</span>
                  <span className="font-medium text-right max-w-[60%]">{incomeDetailModal.description}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">{t('financial.agency')}</span>
                  <span className="font-medium">{incomeDetailModal.source || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b bg-green-50 -mx-2 px-2 rounded">
                  <span className="font-semibold text-gray-700">{t('financial.amount')}</span>
                  <span className="font-bold text-green-600">{formatCurrency(incomeDetailModal.amount)}</span>
                </div>
                {incomeDetailModal.notes && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Notas:</p>
                    <p className="text-sm text-gray-700">{incomeDetailModal.notes}</p>
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs text-gray-400 text-center">
                Este ingreso fue registrado automáticamente al completar el servicio del marketplace y no puede ser editado ni eliminado.
              </p>

              <button
                onClick={() => setIncomeDetailModal(null)}
                className="w-full mt-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialDashboard;
