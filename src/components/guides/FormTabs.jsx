import React from 'react';
import PropTypes from 'prop-types';
import { UserIcon, GlobeAltIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { FORM_TABS } from '../../constants/guidesConstants';

const FormTabs = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();
  const tabIcons = {
    personal: UserIcon,
    languages: GlobeAltIcon,
    museums: AcademicCapIcon
  };

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8 px-6">
        {FORM_TABS.map((tab) => {
          const Icon = tabIcons[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t(tab.labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

FormTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired
};

export default FormTabs;
