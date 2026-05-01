import i18next from 'i18next';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import api from './api';
import { getLanguageName } from '../config/languages';

// Configuracion de colores y estilos
const colors = {
  primary: [59, 130, 246], // blue-500
  secondary: [107, 114, 128], // gray-500
  success: [16, 185, 129], // green-500
  warning: [245, 158, 11], // amber-500
  text: [31, 41, 55], // gray-800
  lightGray: [249, 250, 251], // gray-50
  border: [229, 231, 235], // gray-200
  white: [255, 255, 255]
};

class AssignmentPdfService {
  constructor() {
    this.pdf = null;
    this.pageHeight = 297; // A4 height in mm
    this.pageWidth = 210; // A4 width in mm
    this.margin = 15;
    this.currentY = this.margin;
  }

  /**
   * Parsea fecha ISO sin desfase de timezone.
   * "2026-02-24T00:00:00.000Z" -> Date(2026, 1, 24, 12, 0, 0) (local noon)
   * @param {string} dateStr - Fecha ISO o YYYY-MM-DD
   * @returns {Date|null}
   */
  _safeParseDateString(dateStr) {
    if (!dateStr) return null;
    const dateOnly = String(dateStr).split('T')[0];
    const [year, month, day] = dateOnly.split('-').map(Number);
    if (!year || !month || !day || isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  }

  /**
   * Extrae solo la hora HH:mm de un valor de tiempo
   * @param {string|Date} timeValue - Valor de tiempo
   * @returns {string}
   */
  _formatTime(timeValue) {
    if (!timeValue) return 'N/A';

    // Si es string
    if (typeof timeValue === 'string') {
      // Si ya tiene formato HH:mm o HH:mm:ss
      const timeMatch = timeValue.match(/(\d{2}):(\d{2})/);
      if (timeMatch) {
        return `${timeMatch[1]}:${timeMatch[2]}`;
      }
      // Si es un ISO string, extraer la hora
      if (timeValue.includes('T')) {
        const date = new Date(timeValue);
        if (!isNaN(date.getTime())) {
          return format(date, 'HH:mm');
        }
      }
      return timeValue.substring(0, 5);
    }

    // Si es Date
    if (timeValue instanceof Date && !isNaN(timeValue.getTime())) {
      return format(timeValue, 'HH:mm');
    }

    return 'N/A';
  }

  /**
   * Formatea array de idiomas (pueden ser strings u objetos)
   * Usa getLanguageName centralizado desde config/languages.js
   * @param {Array} languages - Array de idiomas
   * @returns {string}
   */
  _formatLanguages(languages) {
    if (!languages || !Array.isArray(languages) || languages.length === 0) {
      return 'N/A';
    }

    return languages.map(lang => {
      if (typeof lang === 'string') {
        return getLanguageName(lang);
      }
      if (typeof lang === 'object' && lang !== null) {
        if (lang.name) return lang.name;
        if (lang.label) return lang.label;
        if (lang.code) return getLanguageName(lang.code);
        return JSON.stringify(lang);
      }
      return String(lang);
    }).join(', ');
  }

  /**
   * Formatea array de museos (pueden ser strings u objetos)
   * @param {Array} museums - Array de museos
   * @returns {string}
   */
  _formatMuseums(museums) {
    if (!museums || !Array.isArray(museums) || museums.length === 0) {
      return 'N/A';
    }

    return museums.map(museum => {
      // Si es un string simple
      if (typeof museum === 'string') return museum;
      // Si es un objeto con name o label
      if (typeof museum === 'object' && museum !== null) {
        return museum.name || museum.label || museum.code || JSON.stringify(museum);
      }
      return String(museum);
    }).join(', ');
  }

  /**
   * Obtener datos de asignacion del backend
   * @param {string} reservationId - ID de la reserva
   * @returns {Promise<Object>}
   */
  async getAssignmentData(reservationId) {
    try {
      const response = await api.get(`/tours/reservations/${reservationId}/assignment-pdf`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo datos de asignacion:', error);
      throw error;
    }
  }

  /**
   * Genera PDF de ficha de asignacion completa
   * @param {Object} data - Datos de la asignacion
   * @returns {jsPDF}
   */
  generateAssignmentPDF(data) {
    this.pdf = new jsPDF();
    this.currentY = this.margin;

    // Header del documento
    this._addHeader(data);

    // Informacion de la reserva
    this._addReservationInfo(data.reservation, data.tour);

    // Guia asignado
    this._addGuideSection(data.guide);

    // Chofer asignado
    this._addDriverSection(data.driver);

    // Vehiculo asignado
    this._addVehicleSection(data.vehicle);

    // Informacion de recogida
    this._addPickupInfo(data.reservation);

    // Contactos de emergencia
    this._addEmergencyContacts();

    // Footer
    this._addFooter(data);

    return this.pdf;
  }

  /**
   * Descargar PDF de asignacion
   * @param {string} reservationId - ID de la reserva
   * @param {string} filename - Nombre del archivo (opcional)
   */
  async downloadPDF(reservationId, filename = null) {
    try {
      const response = await this.getAssignmentData(reservationId);

      if (!response.success) {
        throw new Error(response.message || i18next.t('errors.unexpectedError'));
      }

      const data = response.data;

      // Verificar si hay advertencias
      if (response.warnings) {
        console.warn('Asignacion incompleta:', response.warnings);
      }

      // Generar PDF
      const pdf = this.generateAssignmentPDF(data);

      // Generar nombre de archivo
      if (!filename) {
        const tourName = data.tour?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'tour';
        const parsedDate = data.reservation?.date ? this._safeParseDateString(data.reservation.date) : null;
        const dateStr = parsedDate
          ? format(parsedDate, 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd');
        filename = `ficha_asignacion_${tourName}_${dateStr}.pdf`;
      }

      // Descargar
      pdf.save(filename);

      return { success: true, filename };
    } catch (error) {
      console.error('Error descargando PDF:', error);
      throw error;
    }
  }

  /**
   * Obtener PDF como blob para envio
   * @param {string} reservationId - ID de la reserva
   * @returns {Promise<Blob>}
   */
  async getPDFBlob(reservationId) {
    const response = await this.getAssignmentData(reservationId);
    if (!response.success) {
      throw new Error(response.message || i18next.t('errors.unexpectedError'));
    }
    const pdf = this.generateAssignmentPDF(response.data);
    return pdf.output('blob');
  }

  // ========== Metodos privados para construccion del PDF ==========

  /**
   * Header del documento
   */
  _addHeader(data) {
    const pdf = this.pdf;

    // Logo/Titulo de la empresa
    pdf.setFontSize(22);
    pdf.setTextColor(...colors.primary);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FUTURISMO TOURS', this.margin, this.currentY);

    // Linea decorativa
    pdf.setDrawColor(...colors.primary);
    pdf.setLineWidth(1);
    pdf.line(this.margin, this.currentY + 3, this.pageWidth - this.margin, this.currentY + 3);

    this.currentY += 12;

    // Titulo del documento
    pdf.setFontSize(16);
    pdf.setTextColor(...colors.text);
    pdf.text('FICHA DE ASIGNACION DE TOUR', this.margin, this.currentY);

    this.currentY += 8;

    // Codigo de reserva y fecha de generacion
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.secondary);

    const reservationCode = data.reservation?.code || 'N/A';
    const generatedDate = format(new Date(), "dd/MM/yyyy HH:mm", { locale: es });

    pdf.text(`Codigo: ${reservationCode}`, this.margin, this.currentY);
    pdf.text(`Generado: ${generatedDate}`, this.pageWidth - this.margin - 50, this.currentY);

    this.currentY += 10;
  }

  /**
   * Seccion de informacion de la reserva
   */
  _addReservationInfo(reservation, tour) {
    const pdf = this.pdf;

    // Titulo de seccion
    this._addSectionTitle('INFORMACION DE LA RESERVA');

    const boxY = this.currentY;
    const boxHeight = 35;

    // Fondo de la seccion
    pdf.setFillColor(...colors.lightGray);
    pdf.setDrawColor(...colors.border);
    pdf.roundedRect(this.margin, boxY, this.pageWidth - (this.margin * 2), boxHeight, 3, 3, 'FD');

    this.currentY += 8;
    pdf.setFontSize(10);

    // Tour
    pdf.setTextColor(...colors.secondary);
    pdf.text('Tour:', this.margin + 5, this.currentY);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text(tour?.name || 'N/A', this.margin + 35, this.currentY);

    // Codigo
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.secondary);
    pdf.text('Codigo:', this.pageWidth / 2, this.currentY);
    pdf.setTextColor(...colors.text);
    pdf.text(tour?.code || 'N/A', this.pageWidth / 2 + 25, this.currentY);

    this.currentY += 7;

    // Fecha
    pdf.setTextColor(...colors.secondary);
    pdf.text('Fecha:', this.margin + 5, this.currentY);
    pdf.setTextColor(...colors.text);
    const parsedDate = reservation?.date ? this._safeParseDateString(reservation.date) : null;
    const dateStr = parsedDate
      ? format(parsedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })
      : 'N/A';
    pdf.text(dateStr, this.margin + 35, this.currentY);

    this.currentY += 7;

    // Hora
    pdf.setTextColor(...colors.secondary);
    pdf.text('Hora:', this.margin + 5, this.currentY);
    pdf.setTextColor(...colors.text);
    const timeStr = this._formatTime(reservation?.time);
    pdf.text(timeStr, this.margin + 35, this.currentY);

    // Pasajeros
    pdf.setTextColor(...colors.secondary);
    pdf.text('Pasajeros:', this.pageWidth / 2, this.currentY);
    pdf.setTextColor(...colors.text);
    const adults = reservation?.adults || 0;
    const children = reservation?.children || 0;
    const total = reservation?.participants || (adults + children);
    pdf.text(`${adults} adultos, ${children} ninos (${total} total)`, this.pageWidth / 2 + 30, this.currentY);

    this.currentY = boxY + boxHeight + 10;
  }

  /**
   * Seccion de guia asignado
   */
  _addGuideSection(guide) {
    const pdf = this.pdf;

    this._addSectionTitle('GUIA ASIGNADO');

    if (!guide) {
      this._addEmptySection(i18next.t('common.noData'));
      return;
    }

    const boxY = this.currentY;
    const specialties = this._formatMuseums(guide.specialties);
    const hasSpecialties = specialties && specialties !== 'N/A';
    const museums = this._formatMuseums(guide.museums);
    const hasMuseums = museums && museums !== 'N/A';
    let extraLines = 0;
    if (hasSpecialties) extraLines++;
    if (hasMuseums) extraLines++;
    const boxHeight = 28 + (extraLines * 7);

    pdf.setFillColor(...colors.white);
    pdf.setDrawColor(...colors.success);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(this.margin, boxY, this.pageWidth - (this.margin * 2), boxHeight, 3, 3, 'FD');

    this.currentY += 8;
    pdf.setFontSize(10);

    // Nombre
    pdf.setTextColor(...colors.secondary);
    pdf.text('Nombre:', this.margin + 5, this.currentY);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text(guide.name || 'N/A', this.margin + 30, this.currentY);

    // Telefono
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...colors.secondary);
    pdf.text('Telefono:', this.pageWidth / 2, this.currentY);
    pdf.setTextColor(...colors.text);
    pdf.text(guide.phone || 'N/A', this.pageWidth / 2 + 28, this.currentY);

    this.currentY += 7;

    // Idiomas
    pdf.setTextColor(...colors.secondary);
    pdf.text('Idiomas:', this.margin + 5, this.currentY);
    pdf.setTextColor(...colors.text);
    const languages = this._formatLanguages(guide.languages);
    pdf.text(languages, this.margin + 30, this.currentY);

    // Licencia
    pdf.setTextColor(...colors.secondary);
    pdf.text('Licencia:', this.pageWidth / 2, this.currentY);
    pdf.setTextColor(...colors.text);
    pdf.text(guide.licenseNumber || 'N/A', this.pageWidth / 2 + 28, this.currentY);

    // Especialidades (si tiene)
    if (hasSpecialties) {
      this.currentY += 7;
      pdf.setTextColor(...colors.secondary);
      pdf.text('Especialidades:', this.margin + 5, this.currentY);
      pdf.setTextColor(...colors.text);
      const specText = specialties.length > 70 ? specialties.substring(0, 67) + '...' : specialties;
      pdf.text(specText, this.margin + 45, this.currentY);
    }

    // Museos (si tiene)
    if (hasMuseums) {
      this.currentY += 7;
      pdf.setTextColor(...colors.secondary);
      pdf.text('Museos:', this.margin + 5, this.currentY);
      pdf.setTextColor(...colors.text);
      const museumText = museums.length > 80 ? museums.substring(0, 77) + '...' : museums;
      pdf.text(museumText, this.margin + 30, this.currentY);
    }

    this.currentY = boxY + boxHeight + 8;
  }

  /**
   * Seccion de chofer asignado
   */
  _addDriverSection(driver) {
    const pdf = this.pdf;

    this._addSectionTitle('CHOFER ASIGNADO');

    if (!driver) {
      this._addEmptySection(i18next.t('common.noData'));
      return;
    }

    const boxY = this.currentY;
    const boxHeight = 20;

    pdf.setFillColor(...colors.white);
    pdf.setDrawColor(...colors.success);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(this.margin, boxY, this.pageWidth - (this.margin * 2), boxHeight, 3, 3, 'FD');

    this.currentY += 8;
    pdf.setFontSize(10);

    // Nombre
    pdf.setTextColor(...colors.secondary);
    pdf.text('Nombre:', this.margin + 5, this.currentY);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text(driver.name || 'N/A', this.margin + 30, this.currentY);
    pdf.setFont('helvetica', 'normal');

    // Telefono
    pdf.setTextColor(...colors.secondary);
    pdf.text('Telefono:', this.pageWidth / 2, this.currentY);
    pdf.setTextColor(...colors.text);
    pdf.text(driver.phone || 'N/A', this.pageWidth / 2 + 28, this.currentY);

    this.currentY += 7;

    // Licencia
    pdf.setTextColor(...colors.secondary);
    pdf.text('Licencia:', this.margin + 5, this.currentY);
    pdf.setTextColor(...colors.text);
    const licenseInfo = `${driver.licenseCategory || ''} - ${driver.licenseNumber || 'N/A'}`;
    pdf.text(licenseInfo, this.margin + 30, this.currentY);

    this.currentY = boxY + boxHeight + 8;
  }

  /**
   * Seccion de vehiculo asignado
   */
  _addVehicleSection(vehicle) {
    const pdf = this.pdf;

    this._addSectionTitle('VEHICULO ASIGNADO');

    if (!vehicle) {
      this._addEmptySection(i18next.t('common.noData'));
      return;
    }

    const boxY = this.currentY;
    const boxHeight = 20;

    pdf.setFillColor(...colors.white);
    pdf.setDrawColor(...colors.success);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(this.margin, boxY, this.pageWidth - (this.margin * 2), boxHeight, 3, 3, 'FD');

    this.currentY += 8;
    pdf.setFontSize(10);

    // Placa
    pdf.setTextColor(...colors.secondary);
    pdf.text('Placa:', this.margin + 5, this.currentY);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text(vehicle.plate || 'N/A', this.margin + 25, this.currentY);
    pdf.setFont('helvetica', 'normal');

    // Capacidad
    pdf.setTextColor(...colors.secondary);
    pdf.text('Capacidad:', this.pageWidth / 2 + 30, this.currentY);
    pdf.setTextColor(...colors.text);
    pdf.text(`${vehicle.capacity || 'N/A'} pasajeros`, this.pageWidth / 2 + 60, this.currentY);

    this.currentY += 7;

    // Vehiculo (marca modelo ano color)
    pdf.setTextColor(...colors.secondary);
    pdf.text('Vehiculo:', this.margin + 5, this.currentY);
    pdf.setTextColor(...colors.text);
    const vehicleDesc = `${vehicle.brand || ''} ${vehicle.model || ''} ${vehicle.year || ''} (${vehicle.color || 'N/A'})`.trim();
    pdf.text(vehicleDesc, this.margin + 33, this.currentY);

    this.currentY = boxY + boxHeight + 8;
  }

  /**
   * Seccion de informacion de recogida
   */
  _addPickupInfo(reservation) {
    const pdf = this.pdf;

    this._addSectionTitle('INFORMACION DE RECOGIDA');

    const boxY = this.currentY;
    const notesText = reservation?.notes || reservation?.specialRequirements || '';
    const hasLongNotes = notesText.length > 40;
    const boxHeight = hasLongNotes ? 32 : 25;

    pdf.setFillColor(...colors.lightGray);
    pdf.setDrawColor(...colors.border);
    pdf.roundedRect(this.margin, boxY, this.pageWidth - (this.margin * 2), boxHeight, 3, 3, 'FD');

    this.currentY += 8;
    pdf.setFontSize(10);

    // Lugar
    pdf.setTextColor(...colors.secondary);
    pdf.text('Lugar:', this.margin + 5, this.currentY);
    pdf.setTextColor(...colors.text);
    pdf.setFont('helvetica', 'bold');
    pdf.text(reservation?.pickupLocation || 'Por confirmar', this.margin + 25, this.currentY);
    pdf.setFont('helvetica', 'normal');

    this.currentY += 7;

    // Hora de recogida
    pdf.setTextColor(...colors.secondary);
    pdf.text('Hora:', this.margin + 5, this.currentY);
    pdf.setTextColor(...colors.text);
    const pickupTimeStr = reservation?.pickupTime
      ? this._formatTime(reservation.pickupTime)
      : 'Por confirmar';
    pdf.text(pickupTimeStr, this.margin + 25, this.currentY);

    // Notas especiales
    if (notesText) {
      pdf.setTextColor(...colors.secondary);
      pdf.text('Notas:', this.pageWidth / 2, this.currentY);
      pdf.setTextColor(...colors.warning);
      const maxLen = 80;
      const truncated = notesText.length > maxLen ? notesText.substring(0, maxLen - 3) + '...' : notesText;
      pdf.text(truncated, this.pageWidth / 2 + 22, this.currentY);
    }

    this.currentY = boxY + boxHeight + 8;
  }

  /**
   * Seccion de contactos de emergencia
   */
  _addEmergencyContacts() {
    const pdf = this.pdf;

    this._addSectionTitle('CONTACTOS DE EMERGENCIA');

    const boxY = this.currentY;
    const boxHeight = 20;

    pdf.setFillColor(254, 243, 199); // amber-100
    pdf.setDrawColor(...colors.warning);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(this.margin, boxY, this.pageWidth - (this.margin * 2), boxHeight, 3, 3, 'FD');

    this.currentY += 8;
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.text);

    pdf.text('Coordinacion: +51 999 888 777', this.margin + 5, this.currentY);
    pdf.text('Emergencias 24h: +51 999 888 780', this.pageWidth / 2, this.currentY);

    this.currentY += 6;
    pdf.text('Email: coordinacion@futurismo.com', this.margin + 5, this.currentY);
    pdf.text('WhatsApp: +51 999 888 779', this.pageWidth / 2, this.currentY);

    this.currentY = boxY + boxHeight + 10;
  }

  /**
   * Footer del documento
   */
  _addFooter(data) {
    const pdf = this.pdf;
    const footerY = this.pageHeight - 25;

    // Linea separadora
    pdf.setDrawColor(...colors.border);
    pdf.setLineWidth(0.3);
    pdf.line(this.margin, footerY, this.pageWidth - this.margin, footerY);

    // Informacion del footer
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.secondary);

    pdf.text('Documento generado automaticamente - Sistema Futurismo Tours', this.margin, footerY + 6);
    pdf.text(`Reserva: ${data.reservation?.code || 'N/A'}`, this.margin, footerY + 11);

    // Estado de la asignacion
    const isComplete = data.guide && data.driver && data.vehicle;
    pdf.setTextColor(isComplete ? colors.success[0] : colors.warning[0],
                     isComplete ? colors.success[1] : colors.warning[1],
                     isComplete ? colors.success[2] : colors.warning[2]);
    pdf.text(isComplete ? 'ASIGNACION COMPLETA' : 'ASIGNACION PENDIENTE', this.pageWidth - this.margin - 45, footerY + 6);

    // Fecha/hora de generacion
    pdf.setTextColor(...colors.secondary);
    pdf.text(format(new Date(), "dd/MM/yyyy HH:mm:ss", { locale: es }), this.pageWidth - this.margin - 45, footerY + 11);
  }

  // ========== Metodos auxiliares ==========

  /**
   * Agregar titulo de seccion
   */
  _addSectionTitle(title) {
    const pdf = this.pdf;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...colors.primary);
    pdf.text(title, this.margin, this.currentY);

    this.currentY += 6;
    pdf.setFont('helvetica', 'normal');
  }

  /**
   * Agregar seccion vacia (cuando no hay datos)
   */
  _addEmptySection(message) {
    const pdf = this.pdf;
    const boxY = this.currentY;
    const boxHeight = 15;

    pdf.setFillColor(...colors.lightGray);
    pdf.setDrawColor(...colors.border);
    pdf.roundedRect(this.margin, boxY, this.pageWidth - (this.margin * 2), boxHeight, 3, 3, 'FD');

    this.currentY += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.secondary);
    pdf.setFont('helvetica', 'italic');
    pdf.text(message, this.margin + 5, this.currentY);
    pdf.setFont('helvetica', 'normal');

    this.currentY = boxY + boxHeight + 8;
  }

  /**
   * Verificar si necesita nueva pagina
   */
  _checkNewPage(requiredHeight = 50) {
    if (this.currentY + requiredHeight > this.pageHeight - 30) {
      this.pdf.addPage();
      this.currentY = this.margin;
      return true;
    }
    return false;
  }
}

// Instancia singleton
const assignmentPdfService = new AssignmentPdfService();

export default assignmentPdfService;
