import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ClockIcon, ArrowDownTrayIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import useProtocolViewer from '../../hooks/useProtocolViewer';
import useEmergencyStore from '../../stores/emergencyStore';
import ProtocolHeader from './ProtocolHeader';
import ProtocolDescription from './ProtocolDescription';
import ProtocolStepsList from './ProtocolStepsList';
import ProtocolContactsList from './ProtocolContactsList';

const ProtocolViewer = ({ protocol, onClose, onEdit, onDownload }) => {
  const { t } = useTranslation();
  const {
    canEdit,
    getPriorityColor,
    getContactType,
    importantReminders,
    stats
  } = useProtocolViewer(protocol);

  // Resolve materialIds to material objects
  const allMaterials = useEmergencyStore((state) => state.materials);
  const fetchMaterials = useEmergencyStore((state) => state.fetchMaterials);

  useEffect(() => {
    if (!allMaterials || allMaterials.length === 0) {
      fetchMaterials();
    }
  }, [allMaterials, fetchMaterials]);

  // Normalize steps: backend returns objects {title, description}, component expects strings
  const rawSteps = protocol?.steps || protocol?.content?.steps || [];
  const normalizedSteps = rawSteps.map(step =>
    typeof step === 'string' ? step : (step.title || step.description || '')
  );

  // Normalize contacts: backend returns at top level
  const normalizedContacts = protocol?.contacts || protocol?.content?.contacts || [];

  // Resolve materialIds to full material objects for display
  const materialIds = protocol?.materialIds || protocol?.content?.materials || [];
  const resolvedMaterials = materialIds
    .map(id => (allMaterials || []).find(m => m.id === id))
    .filter(Boolean);

  return (
    <div className="modal-overlay p-4">
      <div className="modal-content max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        <ProtocolHeader
          protocol={protocol}
          onClose={onClose}
          onEdit={onEdit}
          onDownload={onDownload}
          canEdit={canEdit}
          getPriorityColor={getPriorityColor}
        />

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            <ProtocolDescription
              protocol={protocol}
              importantReminders={importantReminders}
            />

            <ProtocolStepsList
              steps={normalizedSteps}
            />

            <ProtocolContactsList
              contacts={normalizedContacts}
            />

            {resolvedMaterials.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <ShoppingBagIcon className="w-5 h-5 mr-2 text-purple-500" />
                  {t('emergency.protocol.necessaryMaterials')}
                </h3>
                <div className="space-y-3">
                  {resolvedMaterials.map((material) => (
                    <div
                      key={material.id}
                      className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-purple-900">{material.name}</h4>
                        {material.mandatory && (
                          <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                            {t('emergency.materials.mandatory', 'Obligatorio')}
                          </span>
                        )}
                      </div>
                      {material.category && (
                        <p className="text-sm text-purple-700 capitalize">{material.category}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.steps}
                  </div>
                  <div className="text-sm text-gray-600">{t('emergency.protocol.steps')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.contacts}
                  </div>
                  <div className="text-sm text-gray-600">{t('emergency.protocol.contacts')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.materials}
                  </div>
                  <div className="text-sm text-gray-600">{t('emergency.protocol.materials')}</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {t(`emergency.priority.${stats.priority}`).toUpperCase()}
                  </div>
                  <div className="text-sm text-gray-600">{t('emergency.protocol.priority')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="w-4 h-4" />
            <span>{t('emergency.protocol.lastUpdated', { date: protocol?.updatedAt ? new Date(protocol.updatedAt).toLocaleDateString() : (protocol?.lastUpdated || '-') })}</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.close')}
            </button>
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>{t('emergency.protocol.downloadPDF')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ProtocolViewer.propTypes = {
  protocol: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    icon: PropTypes.string,
    category: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    priority: PropTypes.string,
    description: PropTypes.string,
    updatedAt: PropTypes.string,
    steps: PropTypes.arrayOf(PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string
      })
    ])),
    contacts: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      phone: PropTypes.string,
      type: PropTypes.string
    })),
    materialIds: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDownload: PropTypes.func
};

export default ProtocolViewer;