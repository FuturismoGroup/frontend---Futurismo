import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import { PRIORITY_COLORS, CONTACT_TYPES, PRIORITY_LEVELS } from '../constants/emergencyConstants';

const useProtocolViewer = (protocol) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const getPriorityColor = (priority) => {
    return PRIORITY_COLORS[priority] || PRIORITY_COLORS.default;
  };

  const getContactType = (type) => {
    const labelKey = CONTACT_TYPES[type];
    return labelKey ? t(labelKey) : type;
  };

  const getPriorityLevel = (priority) => {
    const labelKey = PRIORITY_LEVELS[priority];
    return labelKey ? t(labelKey) : priority;
  };

  const importantReminders = [
    t('emergency.protocol.stayCalm'),
    t('emergency.protocol.touristSafety'),
    t('emergency.protocol.documentIncidents'),
    t('emergency.protocol.contactCoordinator'),
    t('emergency.protocol.followProtocols')
  ];

  const stats = {
    steps: (protocol?.steps || protocol?.content?.steps || []).length,
    contacts: (protocol?.contacts || protocol?.content?.contacts || []).length,
    materials: (protocol?.materialIds || protocol?.content?.materials || []).length,
    priority: protocol?.priority
  };

  const canEdit = user?.role === 'admin' || user?.role === 'administrator';

  return {
    t,
    user,
    getPriorityColor,
    getContactType,
    getPriorityLevel,
    importantReminders,
    stats,
    canEdit
  };
};

export default useProtocolViewer;