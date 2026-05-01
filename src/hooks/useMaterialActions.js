import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const useMaterialActions = () => {
  const { t } = useTranslation();

  const handleCopyMaterialList = (material, getCategoryInfo) => {
    const itemsList = material.items.map((item, index) => `${index + 1}. ${item}`).join('\n');
    const category = getCategoryInfo(material.category);
    const content = `${material.name}\n${'='.repeat(material.name.length)}\n${t('emergency.materials.category')}: ${category.name}\n${t('emergency.materials.mandatory')}: ${material.mandatory ? t('common.yes') : t('common.no')}\n\n${t('emergency.materials.elements')}:\n${itemsList}`;
    
    navigator.clipboard.writeText(content).then(() => {
      toast.success(t('emergency.materials.copiedToClipboard'));
    }).catch(() => {
      toast.error(t('emergency.materials.copyError'));
    });
  };

  const handlePrintMaterial = (material, getCategoryInfo) => {
    const category = getCategoryInfo(material.category);
    const itemsList = material.items.map((item, index) => `${index + 1}. ${item}`).join('\n');
    
    const printContent = `
      <html>
        <head>
          <title>${t('emergency.materials.material')}: ${material.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .category { color: #666; font-size: 14px; }
            .mandatory { background: #fee; color: #c53030; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .items { margin-top: 20px; }
            .item { margin: 5px 0; }
            @media print { 
              .no-print { display: none; }
              @page { margin: 2cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${category.icon} ${material.name}</h1>
            <div class="category">${t('emergency.materials.category')}: ${category.name}</div>
            ${material.mandatory ? `<div class="mandatory">${t('emergency.materials.mandatoryMaterial')}</div>` : ''}
          </div>
          <div class="items">
            <h3>${t('emergency.materials.necessaryElements', { count: material.items.length })}:</h3>
            ${material.items.map((item, index) => `<div class="item">${index + 1}. ${item}</div>`).join('')}
          </div>
          <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
            ${t('emergency.materials.listGeneratedBy')} - ${new Date().toLocaleDateString('es-ES')}
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setTimeout(() => printWindow.close(), 1000);
  };

  const handlePrintAllMandatory = (filteredMaterials, getCategoryInfo) => {
    const mandatoryMaterials = filteredMaterials.filter(m => m.mandatory);
    
    if (mandatoryMaterials.length === 0) {
      toast.error(t('emergency.materials.noMandatoryToPrint'));
      return;
    }

    const printContent = `
      <html>
        <head>
          <title>${t('emergency.materials.mandatoryChecklistTitle')}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .material { margin-bottom: 30px; page-break-inside: avoid; }
            .material-header { background: #fee; padding: 10px; border-radius: 8px; margin-bottom: 10px; }
            .material-name { font-size: 18px; font-weight: bold; color: #c53030; }
            .category { color: #666; font-size: 14px; }
            .items { margin-left: 20px; }
            .item { margin: 5px 0; }
            .checkbox { margin-right: 10px; }
            @media print { 
              @page { margin: 2cm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📋 ${t('emergency.materials.mandatoryListTitle')}</h1>
            <p>${t('emergency.materials.checklistForGuides')}</p>
            <p><strong>${t('common.date')}:</strong> ${new Date().toLocaleDateString('es-ES')} | <strong>${t('emergency.materials.totalMaterials')}:</strong> ${mandatoryMaterials.length}</p>
          </div>
          
          ${mandatoryMaterials.map(material => {
            const category = getCategoryInfo(material.category);
            return `
              <div class="material">
                <div class="material-header">
                  <div class="material-name">${category.icon} ${material.name}</div>
                  <div class="category">${t('emergency.materials.category')}: ${category.name}</div>
                </div>
                <div class="items">
                  ${material.items.map(item => `
                    <div class="item">
                      <input type="checkbox" class="checkbox"> ${item}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
          
          <div style="margin-top: 40px; border-top: 1px solid #ccc; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
            <p><strong>${t('emergency.materials.important')}:</strong> ${t('emergency.materials.verifyBeforeTour')}</p>
            <p>${t('emergency.materials.listGeneratedBy')} - ${new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    setTimeout(() => printWindow.close(), 1000);
  };

  const handleCopyAllMandatory = (filteredMaterials, getCategoryInfo) => {
    const mandatoryMaterials = filteredMaterials.filter(m => m.mandatory);
    
    if (mandatoryMaterials.length === 0) {
      toast.error(t('emergency.materials.noMandatoryToCopy'));
      return;
    }

    const content = [
      t('emergency.materials.mandatoryListTitle'),
      '='.repeat(35),
      `${t('common.date')}: ${new Date().toLocaleDateString('es-ES')}`,
      `${t('emergency.materials.totalMaterials')}: ${mandatoryMaterials.length}`,
      '',
      ...mandatoryMaterials.map(material => {
        const category = getCategoryInfo(material.category);
        return [
          `${category.icon} ${material.name.toUpperCase()}`,
          `${t('emergency.materials.category')}: ${category.name}`,
          `${t('emergency.materials.elements')}:`,
          ...material.items.map((item, index) => `  ${index + 1}. [ ] ${item}`),
          ''
        ].join('\n');
      }),
      `${t('emergency.materials.important')}: ${t('emergency.materials.verifyBeforeTour')}`,
      '',
      t('emergency.materials.listGeneratedBy')
    ].join('\n');
    
    navigator.clipboard.writeText(content).then(() => {
      toast.success(t('emergency.materials.mandatoryCopiedToClipboard'));
    }).catch(() => {
      toast.error(t('emergency.materials.copyError'));
    });
  };

  return {
    handleCopyMaterialList,
    handlePrintMaterial,
    handlePrintAllMandatory,
    handleCopyAllMandatory
  };
};

export default useMaterialActions;