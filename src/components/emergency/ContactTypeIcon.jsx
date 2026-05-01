import React from 'react';
import PropTypes from 'prop-types';
import { 
  ExclamationTriangleIcon,
  UserIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  HeartIcon,
  ClipboardDocumentListIcon,
  TruckIcon,
  CloudIcon,
  BuildingLibraryIcon,
  CogIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const ContactTypeIcon = ({ type, className = "w-6 h-6" }) => {
  const iconMap = {
    emergency: ExclamationTriangleIcon,
    coordinator: UserIcon,
    management: BuildingOfficeIcon,
    police: ShieldCheckIcon,
    medical: HeartIcon,
    insurance: ClipboardDocumentListIcon,
    towing: TruckIcon,
    weather: CloudIcon,
    local: BuildingLibraryIcon,
    operations: CogIcon
  };

  const Icon = iconMap[type] || PhoneIcon;
  
  return <Icon className={className} />;
};

ContactTypeIcon.propTypes = {
  type: PropTypes.string.isRequired,
  className: PropTypes.string
};

export default ContactTypeIcon;