import i18next from 'i18next';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import useEmergencyStore from '../stores/emergencyStore';

const t = (key) => i18next.t(key);

// Configuración de colores
const colors = {
  emergency: [220, 38, 38], // red-600
  primary: [59, 130, 246], // blue-500
  success: [16, 185, 129], // green-500
  warning: [245, 158, 11], // amber-500
  text: [31, 41, 55], // gray-800
  secondary: [107, 114, 128], // gray-500
  lightGray: [249, 250, 251], // gray-50
  border: [229, 231, 235] // gray-200
};

class EmergencyPDFService {
  constructor() {
    this.pdf = null;
    this.pageHeight = 297; // A4 height in mm
    this.pageWidth = 210; // A4 width in mm
    this.margin = 20;
    this.currentY = this.margin;
  }

  /**
   * Generar PDF de un protocolo individual
   */
  generateProtocolPDF(protocol) {
    this.pdf = new jsPDF();
    this.currentY = this.margin;

    // Header
    this._addProtocolHeader(protocol);
    
    // Información básica
    this._addProtocolInfo(protocol);
    
    // Pasos del protocolo
    this._addProtocolSteps(protocol);
    
    // Contactos de emergencia
    this._addEmergencyContacts(protocol);
    
    // Materiales necesarios
    this._addRequiredMaterials(protocol);
    
    // Footer
    this._addFooter();

    return this.pdf;
  }

  /**
   * Generar PDF con todos los protocolos
   */
  generateAllProtocolsPDF(protocols) {
    this.pdf = new jsPDF();
    this.currentY = this.margin;

    // Portada
    this._addCoverPage();

    // Índice
    this._addIndexPage(protocols);

    // Protocolos individuales - cada uno inicia en página nueva
    if (protocols && protocols.length > 0) {
      protocols.forEach((protocol) => {
        this.pdf.addPage();
        this.currentY = this.margin;

        this._addProtocolHeader(protocol, false);
        this._addProtocolInfo(protocol);
        this._addProtocolSteps(protocol);
        this._addEmergencyContacts(protocol);
        this._addRequiredMaterials(protocol);
      });
    }

    // Página de contactos generales
    this.pdf.addPage();
    this.currentY = this.margin;
    this._addGeneralContactsPage();

    return this.pdf;
  }

  /**
   * Generar kit completo para guías
   */
  generateGuideEmergencyKit() {
    const { protocols, materials } = useEmergencyStore.getState();
    
    this.pdf = new jsPDF();
    this.currentY = this.margin;

    // Portada del kit
    this._addKitCoverPage();
    
    // Resumen ejecutivo
    this.pdf.addPage();
    this.currentY = this.margin;
    this._addExecutiveSummary();
    
    // Lista de verificación pre-tour
    this.pdf.addPage();
    this.currentY = this.margin;
    this._addPreTourChecklist();
    
    // Protocolos resumidos
    this.pdf.addPage();
    this.currentY = this.margin;
    this._addProtocolsSummary(protocols);
    
    // Contactos de emergencia consolidados
    this.pdf.addPage();
    this.currentY = this.margin;
    this._addConsolidatedContacts(protocols);
    
    // Materiales obligatorios
    this.pdf.addPage();
    this.currentY = this.margin;
    this._addMandatoryMaterials(materials);

    return this.pdf;
  }

  /**
   * Descargar PDF de protocolo individual
   */
  async downloadProtocolPDF(protocol) {
    const pdf = this.generateProtocolPDF(protocol);
    const filename = `protocolo_${protocol.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    pdf.save(filename);
  }

  /**
   * Descargar PDF de todos los protocolos
   */
  async downloadAllProtocolsPDF(protocols) {
    try {
      if (!protocols || protocols.length === 0) {
        throw new Error(t('emergency.pdf.noProtocolsForPdf'));
      }
      const pdf = this.generateAllProtocolsPDF(protocols);
      const filename = `protocolos_emergencia_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error(t('emergency.pdf.pdfGenerationError'), error);
      throw error;
    }
  }

  /**
   * Descargar kit completo para guías
   */
  async downloadGuideEmergencyKit() {
    const pdf = this.generateGuideEmergencyKit();
    const filename = `kit_emergencia_guia_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(filename);
  }

  // Métodos privados para construcción del PDF

  _addProtocolHeader(protocol, isStandalone = true) {
    const pdf = this.pdf;

    // Logo/Título de emergencia
    pdf.setFillColor(...colors.emergency);
    pdf.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 15, 'F');

    pdf.setFontSize(18);
    pdf.setTextColor(255, 255, 255);
    pdf.text(t('emergency.pdf.title'), this.margin + 5, this.currentY + 10);

    this.currentY += 20;

    // Título del protocolo
    pdf.setFontSize(16);
    pdf.setTextColor(...colors.text);
    pdf.text(protocol.title || i18next.t('common.noData'), this.margin, this.currentY);

    this.currentY += 10;

    // Información básica
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.secondary);

    const leftColumn = this.margin;
    const rightColumn = this.pageWidth / 2 + 10;

    pdf.text(t('emergency.pdf.category'), leftColumn, this.currentY);
    pdf.setTextColor(...colors.text);
    // Manejar category como string, objeto o undefined
    let categoryText = 'General';
    if (typeof protocol.category === 'string') {
      categoryText = protocol.category;
    } else if (protocol.category && typeof protocol.category === 'object') {
      categoryText = protocol.category.name || protocol.category.title || 'General';
    }
    pdf.text(categoryText.toUpperCase(), leftColumn + 20, this.currentY);
    
    pdf.setTextColor(...colors.secondary);
    pdf.text(t('emergency.pdf.priority'), rightColumn, this.currentY);
    pdf.setTextColor(...colors.text);
    // Manejar priority como string o undefined
    const priorityText = (typeof protocol.priority === 'string' ? protocol.priority : 'MEDIA').toUpperCase();
    pdf.text(priorityText, rightColumn + 20, this.currentY);
    
    this.currentY += 8;
    
    pdf.setTextColor(...colors.secondary);
    pdf.text(t('emergency.pdf.updated'), leftColumn, this.currentY);
    pdf.setTextColor(...colors.text);
    // Asegurar que lastUpdated sea un string válido
    const lastUpdatedText = protocol.lastUpdated || protocol.updatedAt || t('emergency.pdf.notAvailable');
    const formattedLastUpdated = typeof lastUpdatedText === 'string'
      ? lastUpdatedText
      : format(new Date(lastUpdatedText), 'dd/MM/yyyy', { locale: es });
    pdf.text(formattedLastUpdated, leftColumn + 25, this.currentY);

    pdf.setTextColor(...colors.secondary);
    pdf.text(t('emergency.pdf.generated'), rightColumn, this.currentY);
    pdf.setTextColor(...colors.text);
    pdf.text(format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es }), rightColumn + 20, this.currentY);
    
    this.currentY += 15;
  }

  _addProtocolInfo(protocol) {
    const pdf = this.pdf;

    // Descripción
    pdf.setFontSize(12);
    pdf.setTextColor(...colors.primary);
    pdf.text(t('emergency.pdf.description'), this.margin, this.currentY);

    this.currentY += 8;

    pdf.setFontSize(10);
    pdf.setTextColor(...colors.text);
    const description = protocol.description || i18next.t('common.noData');
    const descriptionLines = pdf.splitTextToSize(description, this.pageWidth - (this.margin * 2));
    pdf.text(descriptionLines, this.margin, this.currentY);

    this.currentY += (descriptionLines.length * 5) + 10;
  }

  _addProtocolSteps(protocol) {
    const pdf = this.pdf;

    // Título de pasos
    pdf.setFontSize(12);
    pdf.setTextColor(...colors.primary);
    pdf.text(t('emergency.pdf.steps'), this.margin, this.currentY);

    this.currentY += 10;

    // Cuadro de pasos
    const rawSteps = protocol.steps || protocol.content?.steps || [];
    if (rawSteps.length === 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.secondary);
      pdf.text(i18next.t('common.noData'), this.margin + 5, this.currentY);
      this.currentY += 10;
      return;
    }

    const stepsData = rawSteps.map((step, index) => [
      `${index + 1}`,
      typeof step === 'string' ? step : (step.title || step.description || '')
    ]);

    autoTable(pdf, {
      startY: this.currentY,
      head: [['#', t('emergency.pdf.actionToPerform')]],
      body: stepsData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        textColor: colors.text
      },
      headStyles: {
        fillColor: colors.primary,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 'auto' }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = pdf.lastAutoTable.finalY + 15;
  }

  _addEmergencyContacts(protocol) {
    if (this.currentY > this.pageHeight - 60) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }

    const pdf = this.pdf;

    // Título de contactos
    pdf.setFontSize(12);
    pdf.setTextColor(...colors.emergency);
    pdf.text(t('emergency.pdf.emergencyContacts'), this.margin, this.currentY);

    this.currentY += 10;

    // Tabla de contactos
    const contacts = protocol.contacts || protocol.content?.contacts || [];
    if (contacts.length === 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.secondary);
      pdf.text(i18next.t('common.noData'), this.margin + 5, this.currentY);
      this.currentY += 10;
      return;
    }

    const contactsData = contacts.map(contact => [
      contact.name || i18next.t('common.noData'),
      contact.phone || i18next.t('common.noData'),
      contact.type ? contact.type.charAt(0).toUpperCase() + contact.type.slice(1) : 'General'
    ]);

    autoTable(pdf, {
      startY: this.currentY,
      head: [[t('emergency.pdf.contact'), t('emergency.pdf.phone'), t('emergency.pdf.type')]],
      body: contactsData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: colors.text
      },
      headStyles: {
        fillColor: colors.emergency,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 40, fontStyle: 'bold' },
        2: { cellWidth: 30 }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = pdf.lastAutoTable.finalY + 15;
  }

  _addRequiredMaterials(protocol) {
    if (this.currentY > this.pageHeight - 40) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }

    const pdf = this.pdf;

    // Título de materiales
    pdf.setFontSize(12);
    pdf.setTextColor(...colors.primary);
    pdf.text(t('emergency.pdf.requiredMaterials'), this.margin, this.currentY);

    this.currentY += 8;

    // Resolve materialIds to material names using the store
    const materialIds = protocol.materialIds || protocol.content?.materials || [];
    const allMaterials = useEmergencyStore.getState().materials || [];
    const resolvedMaterials = materialIds
      .map(id => allMaterials.find(m => m.id === id))
      .filter(Boolean);

    if (resolvedMaterials.length > 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.text);

      resolvedMaterials.forEach(material => {
        const label = material.name + (material.mandatory ? ` ${t('emergency.pdf.mandatory')}` : '');
        pdf.text(`• ${label}`, this.margin + 5, this.currentY);
        this.currentY += 5;
      });
    } else {
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.secondary);
      pdf.text(i18next.t('common.noData'), this.margin + 5, this.currentY);
    }

    this.currentY += 10;
  }

  _addCoverPage() {
    const pdf = this.pdf;
    
    // Fondo de portada
    pdf.setFillColor(...colors.emergency);
    pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Título principal
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text(t('emergency.pdf.protocolsOf'), this.pageWidth / 2, 80, { align: 'center' });
    pdf.text(t('emergency.pdf.emergencyWord'), this.pageWidth / 2, 100, { align: 'center' });
    
    // Subtítulo
    pdf.setFontSize(16);
    pdf.text(t('emergency.pdf.guideManual'), this.pageWidth / 2, 120, { align: 'center' });
    
    // Separador visual
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1);
    pdf.line(this.pageWidth / 2 - 30, 150, this.pageWidth / 2 + 30, 150);
    
    // Información de la empresa
    pdf.setFontSize(14);
    pdf.text(t('emergency.pdf.companyName'), this.pageWidth / 2, 200, { align: 'center' });
    
    // Fecha
    pdf.setFontSize(12);
    pdf.text(format(new Date(), 'dd \'de\' MMMM \'de\' yyyy', { locale: es }), this.pageWidth / 2, 220, { align: 'center' });
    
    // Advertencia
    pdf.setFontSize(10);
    pdf.text(t('emergency.pdf.confidential'), this.pageWidth / 2, 270, { align: 'center' });
  }

  _addIndexPage(protocols) {
    this.pdf.addPage();
    this.currentY = this.margin;

    const pdf = this.pdf;

    // Título del índice
    pdf.setFontSize(18);
    pdf.setTextColor(...colors.text);
    pdf.text(t('emergency.pdf.protocolIndex'), this.margin, this.currentY);

    this.currentY += 15;

    // Lista de protocolos
    if (!protocols || protocols.length === 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.secondary);
      pdf.text(t('emergency.pdf.noProtocols'), this.margin, this.currentY);
      return;
    }

    protocols.forEach((protocol, index) => {
      pdf.setFontSize(12);
      pdf.setTextColor(...colors.text);

      const pageNum = index + 3; // Ajustar por portada e índice
      pdf.text(protocol.title || i18next.t('common.noData'), this.margin, this.currentY);
      pdf.text(`${pageNum}`, this.pageWidth - this.margin - 10, this.currentY, { align: 'right' });

      // Línea punteada
      pdf.setDrawColor(...colors.border);
      const dotsY = this.currentY - 2;
      for (let x = this.margin + 80; x < this.pageWidth - this.margin - 20; x += 3) {
        pdf.circle(x, dotsY, 0.3, 'F');
      }

      this.currentY += 8;
    });
  }

  _addKitCoverPage() {
    const pdf = this.pdf;
    
    // Fondo de portada
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    
    // Título principal
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.text(t('emergency.pdf.emergencyKit'), this.pageWidth / 2, 70, { align: 'center' });
    pdf.text(t('emergency.pdf.forGuides'), this.pageWidth / 2, 90, { align: 'center' });
    
    // Subtítulo
    pdf.setFontSize(14);
    pdf.text(t('emergency.pdf.pocketManual'), this.pageWidth / 2, 110, { align: 'center' });
    
    // Separador visual
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(1);
    pdf.line(this.pageWidth / 2 - 30, 130, this.pageWidth / 2 + 30, 130);
    
    // Información
    pdf.setFontSize(12);
    pdf.text(t('emergency.pdf.companyName'), this.pageWidth / 2, 180, { align: 'center' });
    pdf.text(format(new Date(), 'MMMM yyyy', { locale: es }).toUpperCase(), this.pageWidth / 2, 195, { align: 'center' });
    
    // Instrucciones de uso
    pdf.setFontSize(10);
    pdf.text(t('emergency.pdf.keepAccessible'), this.pageWidth / 2, 250, { align: 'center' });
  }

  _addExecutiveSummary() {
    const pdf = this.pdf;
    
    pdf.setFontSize(16);
    pdf.setTextColor(...colors.text);
    pdf.text(t('emergency.pdf.executiveSummary'), this.margin, this.currentY);
    
    this.currentY += 15;
    
    const summaryText = [
      t('emergency.pdf.summaryText1'),
      t('emergency.pdf.summaryText2'),
      t('emergency.pdf.summaryText3'),
      t('emergency.pdf.summaryText4'),
      t('emergency.pdf.summaryText5')
    ];
    
    pdf.setFontSize(11);
    summaryText.forEach(text => {
      const lines = pdf.splitTextToSize(text, this.pageWidth - (this.margin * 2));
      pdf.text(`• ${lines.join(' ')}`, this.margin, this.currentY);
      this.currentY += 8;
    });
    
    this.currentY += 10;
    
    // Números de emergencia principales
    pdf.setFillColor(...colors.emergency);
    pdf.rect(this.margin, this.currentY, this.pageWidth - (this.margin * 2), 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text(t('emergency.pdf.mainEmergencyNumbers'), this.margin + 5, this.currentY + 8);

    pdf.setFontSize(12);
    pdf.text(`> ${t('emergency.pdf.nationalEmergencies')}: 105`, this.margin + 5, this.currentY + 18);
    pdf.text(`> ${t('emergency.pdf.tourCoordinator')}: +51 999 888 777`, this.margin + 5, this.currentY + 28);
    pdf.text(`> ${t('emergency.pdf.emergency24h')}: +51 999 888 779`, this.margin + 5, this.currentY + 38);
  }

  _addPreTourChecklist() {
    const pdf = this.pdf;
    
    pdf.setFontSize(16);
    pdf.setTextColor(...colors.text);
    pdf.text(t('emergency.pdf.preTourChecklist'), this.margin, this.currentY);
    
    this.currentY += 15;
    
    const checklist = [
      t('emergency.pdf.checklistItem1'),
      t('emergency.pdf.checklistItem2'),
      t('emergency.pdf.checklistItem3'),
      t('emergency.pdf.checklistItem4'),
      t('emergency.pdf.checklistItem5'),
      t('emergency.pdf.checklistItem6'),
      t('emergency.pdf.checklistItem7'),
      t('emergency.pdf.checklistItem8')
    ];
    
    pdf.setFontSize(11);
    checklist.forEach(item => {
      pdf.text(`[ ] ${item}`, this.margin, this.currentY);
      this.currentY += 8;
    });
  }

  _addProtocolsSummary(protocols) {
    const pdf = this.pdf;

    pdf.setFontSize(16);
    pdf.setTextColor(...colors.text);
    pdf.text(t('emergency.pdf.protocolSummary'), this.margin, this.currentY);

    this.currentY += 15;

    protocols.forEach(protocol => {
      // Título del protocolo
      pdf.setFontSize(12);
      pdf.setTextColor(...colors.primary);
      pdf.text(protocol.title || i18next.t('common.noData'), this.margin, this.currentY);

      this.currentY += 8;

      // Primeros 3 pasos
      const steps = protocol.steps || protocol.content?.steps || [];
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.text);
      steps.slice(0, 3).forEach((step, index) => {
        const stepText = typeof step === 'string' ? step : (step.title || step.description || '');
        pdf.text(`${index + 1}. ${stepText}`, this.margin + 5, this.currentY);
        this.currentY += 5;
      });

      if (steps.length === 0) {
        pdf.setTextColor(...colors.secondary);
        pdf.text(i18next.t('common.noData'), this.margin + 5, this.currentY);
        this.currentY += 5;
      }

      this.currentY += 5;

      // Verificar espacio en la página
      if (this.currentY > this.pageHeight - 40) {
        pdf.addPage();
        this.currentY = this.margin;
      }
    });
  }

  _addConsolidatedContacts(protocols) {
    const pdf = this.pdf;

    pdf.setFontSize(16);
    pdf.setTextColor(...colors.text);
    pdf.text(t('emergency.pdf.consolidatedContacts'), this.margin, this.currentY);

    this.currentY += 15;

    // Recopilar todos los contactos únicos
    const allContacts = [];
    protocols.forEach(protocol => {
      const contacts = protocol.contacts || protocol.content?.contacts || [];
      contacts.forEach(contact => {
        if (contact && contact.phone && !allContacts.find(c => c.phone === contact.phone)) {
          allContacts.push(contact);
        }
      });
    });

    if (allContacts.length === 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.secondary);
      pdf.text(t('emergency.pdf.noContacts'), this.margin + 5, this.currentY);
      return;
    }

    // Tabla de contactos
    const contactsData = allContacts.map(contact => [
      contact.name || i18next.t('common.noData'),
      contact.phone || i18next.t('common.noData'),
      contact.type ? contact.type.charAt(0).toUpperCase() + contact.type.slice(1) : 'General'
    ]);

    autoTable(pdf, {
      startY: this.currentY,
      head: [[t('emergency.pdf.contact'), t('emergency.pdf.phone'), t('emergency.pdf.type')]],
      body: contactsData,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: colors.text
      },
      headStyles: {
        fillColor: colors.emergency,
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      margin: { left: this.margin, right: this.margin }
    });
  }

  _addMandatoryMaterials(materials) {
    const pdf = this.pdf;
    
    pdf.setFontSize(16);
    pdf.setTextColor(...colors.text);
    pdf.text(t('emergency.pdf.mandatoryMaterials'), this.margin, this.currentY);
    
    this.currentY += 15;
    
    const mandatoryMaterials = materials.filter(m => m.mandatory);
    
    mandatoryMaterials.forEach(material => {
      // Nombre del material
      pdf.setFontSize(12);
      pdf.setTextColor(...colors.primary);
      pdf.text(material.name, this.margin, this.currentY);
      
      this.currentY += 8;
      
      // Items
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.text);
      material.items.forEach(item => {
        pdf.text(`• ${item}`, this.margin + 5, this.currentY);
        this.currentY += 5;
      });
      
      this.currentY += 5;
    });
  }

  _addGeneralContactsPage() {
    const pdf = this.pdf;
    
    pdf.setFontSize(18);
    pdf.setTextColor(...colors.text);
    pdf.text(t('emergency.pdf.generalContacts'), this.margin, this.currentY);
    
    this.currentY += 15;
    
    const generalContacts = [
      { category: t('emergency.pdf.nationalEmergencies'), contacts: [
        { name: t('emergency.pdf.firefighters'), phone: '116' },
        { name: t('emergency.pdf.nationalPolice'), phone: '105' },
        { name: t('emergency.pdf.samuMedical'), phone: '106' },
        { name: t('emergency.pdf.civilDefense'), phone: '115' }
      ]},
      { category: t('emergency.pdf.companyName'), contacts: [
        { name: t('emergency.pdf.tourCoordinator'), phone: '+51 999 888 777' },
        { name: t('emergency.pdf.management'), phone: '+51 999 888 778' },
        { name: t('emergency.pdf.emergency24h'), phone: '+51 999 888 779' },
        { name: t('emergency.pdf.operations'), phone: '+51 999 888 781' }
      ]},
      { category: t('emergency.pdf.specializedServices'), contacts: [
        { name: t('emergency.pdf.senamhiWeather'), phone: '115' },
        { name: t('emergency.pdf.medicalInsurance'), phone: '+51 999 888 780' },
        { name: t('emergency.pdf.towingService'), phone: '+51 999 888 786' }
      ]}
    ];
    
    generalContacts.forEach(category => {
      pdf.setFontSize(14);
      pdf.setTextColor(...colors.primary);
      pdf.text(category.category, this.margin, this.currentY);
      
      this.currentY += 8;
      
      category.contacts.forEach(contact => {
        pdf.setFontSize(11);
        pdf.setTextColor(...colors.text);
        pdf.text(`• ${contact.name}: ${contact.phone}`, this.margin + 5, this.currentY);
        this.currentY += 6;
      });
      
      this.currentY += 5;
    });
  }

  _addFooter() {
    const pdf = this.pdf;
    const footerY = this.pageHeight - 20;
    
    // Línea separadora
    pdf.setDrawColor(...colors.border);
    pdf.line(this.margin, footerY, this.pageWidth - this.margin, footerY);
    
    // Información del pie
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.secondary);
    pdf.text(t('emergency.pdf.protocolFooter'), this.margin, footerY + 6);
    
    const pageNum = pdf.internal.getCurrentPageInfo().pageNumber;
    pdf.text(`${t('emergency.pdf.page')} ${pageNum}`, this.pageWidth - this.margin - 15, footerY + 6);
    
    pdf.text(`${t('emergency.pdf.generated')} ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`, this.margin, footerY + 12);
  }
}

// Instancia singleton
const emergencyPDFService = new EmergencyPDFService();

export default emergencyPDFService;