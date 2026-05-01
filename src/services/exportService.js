import i18next from 'i18next';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import reservationsService from './reservationsService';

// === Helpers de formato y traducción ===
const t = (key) => i18next.t(key);

const STATUS_LABELS = {
  pending: 'common.status.pending',
  confirmed: 'common.status.confirmed',
  in_progress: 'common.status.inProgress',
  completed: 'common.status.completed',
  cancelled: 'common.status.cancelled'
};

const PAYMENT_STATUS_LABELS = {
  pending: 'common.status.pending',
  paid: 'common.status.paid',
  partial: 'common.status.partial',
  refunded: 'common.status.refunded',
  failed: 'common.status.failed'
};

const PAYMENT_METHOD_LABELS_LOCAL = {
  cash: 'profile.paymentMethods.cash',
  card: 'profile.paymentMethods.creditCard',
  transfer: 'profile.paymentMethods.bankTransfer',
  yape: 'profile.paymentMethods.yape',
  plin: 'profile.paymentMethods.plin',
  paypal: 'PayPal',
  pending: 'common.status.pending'
};

const translateStatus = (status) => STATUS_LABELS[status] ? t(STATUS_LABELS[status]) : (status || t('common.unknown'));
const translatePaymentStatus = (status) => PAYMENT_STATUS_LABELS[status] ? t(PAYMENT_STATUS_LABELS[status]) : (status || t('common.unknown'));
const translatePaymentMethod = (method) => PAYMENT_METHOD_LABELS_LOCAL[method] ? t(PAYMENT_METHOD_LABELS_LOCAL[method]) : (method || t('common.notSpecified'));

const formatExportDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return '';
  }
};

const formatExportTime = (timeStr) => {
  if (!timeStr) return '';
  try {
    const date = new Date(timeStr);
    if (isNaN(date.getTime())) return '';
    return date.toTimeString().split(' ')[0].substring(0, 5);
  } catch {
    return '';
  }
};

const formatCurrency = (amount) => `S/. ${Number(amount || 0).toFixed(2)}`;

class ExportService {
  // Obtener datos de reservas desde la API (con paginación)
  async getReservationsData() {
    try {
      const pageSize = 100;
      let page = 1;
      let allReservations = [];
      let hasMore = true;

      while (hasMore) {
        const result = await reservationsService.getReservations({ pageSize, page });

        if (!result.success) {
          console.error('Error al obtener reservas:', result.error);
          return allReservations.length > 0 ? allReservations : [];
        }

        const reservations = result.data?.data || result.data?.reservations || [];

        if (!Array.isArray(reservations) || reservations.length === 0) {
          hasMore = false;
          break;
        }

        allReservations = allReservations.concat(reservations);

        const total = result.data?.total || 0;
        hasMore = allReservations.length < total;
        page++;
      }

      const reservations = allReservations;

      return reservations.map(reservation => ({
        id: reservation.id || 'N/A',
        date: reservation.date || '',
        time: reservation.time || '',
        tourName: reservation.tour?.name || reservation.tourName || 'Tour no especificado',
        tourType: reservation.tour?.tourType || '',
        agencyName: reservation.agency?.businessName || reservation.agencyName || i18next.t('common.noData'),
        agencyPhone: reservation.agency?.phone || reservation.agencyPhone || '',
        agencyEmail: reservation.agency?.email || reservation.agencyEmail || '',
        adults: Number(reservation.adults || 0),
        children: Number(reservation.children || 0),
        participants: Number(reservation.participants || (reservation.adults || 0) + (reservation.children || 0)),
        total: Number(reservation.totalAmount || reservation.total_amount || 0),
        status: reservation.status || 'pending',
        guideName: reservation.guide
          ? `${reservation.guide.firstName || ''} ${reservation.guide.lastName || ''}`.trim() || 'Guía asignado'
          : (reservation.guideName || i18next.t('common.noData')),
        paymentMethod: reservation.paymentMethod || reservation.payment_method || '',
        paymentStatus: reservation.paymentStatus || reservation.payment_status || 'pending',
        pickupLocation: reservation.pickupLocation || '',
        billingName: reservation.billingName || '',
        createdAt: reservation.createdAt || '',
        guideId: reservation.guideId || null,
        tourAssignment: reservation.tourAssignment || null
      }));
    } catch (error) {
      console.error('Error al cargar reservas desde la API:', error);
      return [];
    }
  }

  // Filtrar datos por estado
  filterDataByStatus(data, status) {
    if (status === 'all') return data;
    return data.filter(item => item.status === status);
  }

  // Formatear datos de reservas para exportación con headers en español
  _formatReservationsForExport(data) {
    return data.map(item => ({
      'ID': item.id ? item.id.substring(0, 8).toUpperCase() : 'N/A',
      'Fecha': formatExportDate(item.date),
      'Hora': formatExportTime(item.time),
      'Tour': item.tourName,
      'Agencia': item.agencyName,
      'Teléfono Agencia': item.agencyPhone || 'N/A',
      'Email Agencia': item.agencyEmail || 'N/A',
      'Adultos': item.adults,
      'Niños': item.children,
      'Total Pasajeros': item.participants,
      'Monto Total': formatCurrency(item.total),
      'Estado': translateStatus(item.status),
      'Guía': item.guideName,
      'Método Pago': translatePaymentMethod(item.paymentMethod),
      'Estado Pago': translatePaymentStatus(item.paymentStatus),
      'Lugar Recojo': item.pickupLocation || '',
      'Nombre Facturación': item.billingName || ''
    }));
  }

  // Exportar a Excel (método genérico - usado también por ReservationManagement y Reports)
  exportToExcel(data, filename = 'reservas_export', sheetName = 'Reservas') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    // Calcular anchos de columnas dinámicamente basado en el contenido
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const colWidths = headers.map(header => {
        const headerLen = header.length;
        const maxDataLen = data.reduce((max, row) => {
          const val = String(row[header] ?? '');
          return Math.max(max, val.length);
        }, 0);
        return { wch: Math.min(Math.max(maxDataLen, headerLen) + 2, 40) };
      });
      worksheet['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // Exportar a PDF
  exportToPDF(data, filename = 'reservas_export', title = 'Reporte de Reservas', options = {}) {
    const doc = new jsPDF('l', 'mm', 'a4'); // Orientación landscape

    // Título del documento
    doc.setFontSize(18);
    doc.text(title, 15, 20);

    // Fecha del reporte
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-PE')}`, 15, 30);

    // Configurar tabla
    const headers = [
      'ID', 'Fecha', 'Hora', 'Tour', 'Agencia',
      'Adultos', 'Niños', 'Pasajeros', 'Monto Total', 'Estado', 'Guía', 'Estado Pago'
    ];

    const rows = data.map(item => [
      item.id ? item.id.substring(0, 8).toUpperCase() : 'N/A',
      formatExportDate(item.date),
      formatExportTime(item.time),
      item.tourName.length > 25 ? item.tourName.substring(0, 25) + '...' : item.tourName,
      item.agencyName.length > 20 ? item.agencyName.substring(0, 20) + '...' : item.agencyName,
      item.adults,
      item.children,
      item.participants,
      formatCurrency(item.total),
      translateStatus(item.status),
      item.guideName.length > 18 ? item.guideName.substring(0, 18) + '...' : item.guideName,
      translatePaymentStatus(item.paymentStatus)
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      styles: {
        fontSize: 7,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [59, 130, 246], // Azul primary
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // Gris claro
      },
      columnStyles: {
        5: { halign: 'center' },  // Adultos centrado
        6: { halign: 'center' },  // Niños centrado
        7: { halign: 'center' },  // Pasajeros centrado
        8: { halign: 'right' }    // Monto Total alineado derecha
      }
    });

    // Agregar estadísticas al final
    const finalY = doc.previousAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text('Resumen:', 15, finalY);

    doc.setFontSize(10);
    const totalReservations = data.length;
    const totalRevenue = data.reduce((sum, item) => sum + item.total, 0);
    const totalTourists = data.reduce((sum, item) => sum + item.adults + item.children, 0);

    doc.text(`Total de Reservas: ${totalReservations}`, 15, finalY + 10);
    doc.text(`Total de Turistas: ${totalTourists}`, 15, finalY + 20);
    if (!options.hideIncome) {
      doc.text(`Ingresos Totales: ${formatCurrency(totalRevenue)}`, 15, finalY + 30);
    }

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Función auxiliar para descargar blobs
  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Método principal de exportación
  async exportData(format, status = 'all', customFilename = null, options = {}) {
    const allData = await this.getReservationsData();
    const filteredData = this.filterDataByStatus(allData, status);

    if (filteredData.length === 0) {
      alert('No hay datos para exportar con los filtros seleccionados.');
      return;
    }

    const statusLabels = {
      'all': 'completa',
      'pending': 'pendientes',
      'confirmed': 'confirmadas',
      'cancelled': 'canceladas'
    };

    const baseFilename = customFilename || `reservas_${statusLabels[status] || status}`;
    const title = `Reporte de Reservas ${(statusLabels[status] || status).charAt(0).toUpperCase() + (statusLabels[status] || status).slice(1)}`;

    switch (format) {
      case 'excel':
        // Formatear datos con headers en español antes de exportar
        this.exportToExcel(this._formatReservationsForExport(filteredData), baseFilename, 'Reservas');
        break;
      case 'pdf':
        this.exportToPDF(filteredData, baseFilename, title, options);
        break;
      default:
        console.error('Formato de exportación no soportado:', format);
    }
  }

  // Obtener estadísticas de los datos filtrados
  async getFilteredStats(status = 'all') {
    const allData = await this.getReservationsData();
    const filteredData = this.filterDataByStatus(allData, status);

    const totalRevenue = filteredData.reduce((sum, item) => sum + item.total, 0);
    const avgTicket = filteredData.length > 0 ? (filteredData.reduce((sum, item) => sum + item.total, 0) / filteredData.length) : 0;

    return {
      totalReservations: filteredData.length,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalTourists: filteredData.reduce((sum, item) => sum + item.adults + item.children, 0),
      avgTicket: parseFloat(avgTicket.toFixed(2))
    };
  }

  // ========== ASSIGNMENTS EXPORT ==========

  // Obtener datos de asignaciones desde reservaciones activas
  async getAssignmentsData() {
    try {
      const allReservations = await this.getReservationsData();

      // Filtrar solo reservas activas (pending/confirmed)
      const activeReservations = allReservations.filter(r => {
        const status = r.status?.toLowerCase();
        return status === 'pending' || status === 'confirmed';
      });

      return activeReservations.map(reservation => {
        const assignment = reservation.tourAssignment || {};
        const hasGuide = !!(assignment.guideId || reservation.guideId);
        const hasDriver = !!assignment.driverId;
        const hasVehicle = !!assignment.vehicleId;

        // Formatear arrays JSON a strings legibles
        const formatArray = (arr) => {
          if (!arr || !Array.isArray(arr) || arr.length === 0) return 'N/A';
          return arr.join(', ');
        };

        return {
          tourCode: reservation.id ? reservation.id.substring(0, 8).toUpperCase() : 'N/A',
          tourName: reservation.tourName || 'Tour sin nombre',
          date: reservation.date || '',
          category: reservation.tourType || 'N/A',
          duration: 'N/A',
          groupSize: reservation.participants || 0,

          // Guía
          guideName: assignment.guideName || reservation.guideName || i18next.t('common.noData'),
          guideLanguages: formatArray(assignment.guideLanguages),
          guideSpecialties: formatArray(assignment.guideSpecialties),

          // Chofer
          driverName: assignment.driverName || i18next.t('common.noData'),
          driverLicense: assignment.driverLicense || 'N/A',
          driverCategory: assignment.driverCategory || 'N/A',

          // Vehículo
          vehiclePlate: assignment.vehiclePlate || i18next.t('common.noData'),
          vehicleBrand: assignment.vehicleBrand || 'N/A',
          vehicleModel: assignment.vehicleInfo || 'N/A',
          vehicleCapacity: assignment.vehicleCapacity || 0,

          // Estado
          status: (hasGuide && hasDriver && hasVehicle) ? 'Completo' : 'Pendiente',
          hasGuide: hasGuide ? 'Sí' : 'No',
          hasDriver: hasDriver ? 'Sí' : 'No',
          hasVehicle: hasVehicle ? 'Sí' : 'No'
        };
      });
    } catch (error) {
      console.error('Error al cargar datos de asignaciones:', error);
      return [];
    }
  }

  // Filtrar asignaciones por estado
  filterAssignmentsByStatus(data, status) {
    if (status === 'all') return data;
    if (status === 'completed') return data.filter(item => item.status === 'Completo');
    if (status === 'pending') return data.filter(item => item.status === 'Pendiente');
    return data;
  }

  // Exportar asignaciones a Excel
  exportAssignmentsToExcel(data, filename = 'asignaciones_export') {
    const worksheet = XLSX.utils.json_to_sheet(data.map(item => ({
      'Código Tour': item.tourCode,
      'Nombre Tour': item.tourName,
      'Fecha': formatExportDate(item.date),
      'Categoría': item.category,
      'Duración': item.duration,
      'Participantes': item.groupSize,
      'Guía': item.guideName,
      'Idiomas Guía': item.guideLanguages,
      'Especialidades': item.guideSpecialties,
      'Chofer': item.driverName,
      'Licencia': item.driverLicense,
      'Categoría Lic.': item.driverCategory,
      'Vehículo': item.vehiclePlate,
      'Marca': item.vehicleBrand,
      'Modelo': item.vehicleModel,
      'Capacidad': item.vehicleCapacity,
      'Estado': item.status
    })));

    const workbook = XLSX.utils.book_new();

    // Configurar anchos de columnas
    const colWidths = [
      { wch: 12 }, // Código
      { wch: 25 }, // Nombre
      { wch: 12 }, // Fecha
      { wch: 15 }, // Categoría
      { wch: 10 }, // Duración
      { wch: 12 }, // Participantes
      { wch: 20 }, // Guía
      { wch: 15 }, // Idiomas
      { wch: 20 }, // Especialidades
      { wch: 20 }, // Chofer
      { wch: 12 }, // Licencia
      { wch: 10 }, // Cat. Lic.
      { wch: 12 }, // Vehículo
      { wch: 12 }, // Marca
      { wch: 12 }, // Modelo
      { wch: 10 }, // Capacidad
      { wch: 10 }  // Estado
    ];
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asignaciones');
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // Exportar asignaciones a PDF
  exportAssignmentsToPDF(data, filename = 'asignaciones_export', title = 'Reporte de Asignaciones') {
    const doc = new jsPDF('l', 'mm', 'a4'); // Orientación landscape

    // Título del documento
    doc.setFontSize(18);
    doc.text(title, 15, 20);

    // Fecha del reporte
    doc.setFontSize(10);
    doc.text(`Generado el: ${new Date().toLocaleDateString('es-PE')}`, 15, 30);

    // Configurar tabla
    const headers = [
      'Código', 'Tour', 'Fecha', 'Categoría', 'Participantes',
      'Guía', 'Chofer', 'Vehículo', 'Estado'
    ];

    const rows = data.map(item => [
      item.tourCode,
      item.tourName.length > 20 ? item.tourName.substring(0, 20) + '...' : item.tourName,
      new Date(item.date).toLocaleDateString('es-PE'),
      item.category,
      item.groupSize,
      item.guideName.length > 15 ? item.guideName.substring(0, 15) + '...' : item.guideName,
      item.driverName.length > 15 ? item.driverName.substring(0, 15) + '...' : item.driverName,
      item.vehiclePlate,
      item.status
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 40,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [59, 130, 246], // Azul primary
        textColor: 255
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251] // Gris claro
      },
      columnStyles: {
        4: { halign: 'center' }, // Participantes centrado
        8: { halign: 'center' }  // Estado centrado
      }
    });

    // Agregar estadísticas al final
    const finalY = doc.previousAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text('Resumen:', 15, finalY);

    doc.setFontSize(10);
    const totalTours = data.length;
    const completeAssignments = data.filter(item => item.status === 'Completo').length;
    const pendingAssignments = data.filter(item => item.status === 'Pendiente').length;
    const totalParticipants = data.reduce((sum, item) => sum + item.groupSize, 0);

    doc.text(`Total de Tours: ${totalTours}`, 15, finalY + 10);
    doc.text(`Asignaciones Completas: ${completeAssignments}`, 15, finalY + 20);
    doc.text(`Asignaciones Pendientes: ${pendingAssignments}`, 15, finalY + 30);
    doc.text(`Total de Participantes: ${totalParticipants}`, 15, finalY + 40);

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  // Método principal de exportación de asignaciones
  async exportAssignments(format, status = 'all', customFilename = null) {
    const allData = await this.getAssignmentsData();
    const filteredData = this.filterAssignmentsByStatus(allData, status);

    if (filteredData.length === 0) {
      alert('No hay datos de asignaciones para exportar con los filtros seleccionados.');
      return;
    }

    const statusLabels = {
      'all': 'completas',
      'completed': 'completadas',
      'pending': 'pendientes'
    };

    const baseFilename = customFilename || `asignaciones_${statusLabels[status]}`;
    const title = `Reporte de Asignaciones ${statusLabels[status].charAt(0).toUpperCase() + statusLabels[status].slice(1)}`;

    switch (format) {
      case 'excel':
        this.exportAssignmentsToExcel(filteredData, baseFilename);
        break;
      case 'pdf':
        this.exportAssignmentsToPDF(filteredData, baseFilename, title);
        break;
      default:
        console.error('Formato de exportación no soportado:', format);
    }
  }

  // Obtener estadísticas de asignaciones filtradas
  async getAssignmentsStats(status = 'all') {
    const allData = await this.getAssignmentsData();
    const filteredData = this.filterAssignmentsByStatus(allData, status);

    const avgGroupSize = filteredData.length > 0 ? (filteredData.reduce((sum, item) => sum + item.groupSize, 0) / filteredData.length) : 0;

    return {
      totalTours: filteredData.length,
      completeAssignments: filteredData.filter(item => item.status === 'Completo').length,
      pendingAssignments: filteredData.filter(item => item.status === 'Pendiente').length,
      totalParticipants: filteredData.reduce((sum, item) => sum + item.groupSize, 0),
      avgGroupSize: parseFloat(avgGroupSize.toFixed(1))
    };
  }
}

export default new ExportService();
