import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const UserFormTabs = ({ activeTab, setActiveTab }) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'basic', name: t('users.form.basicInfo'), icon: UserIcon }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">{tab.name}</span>
            <span className="sm:hidden">Info</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default UserFormTabs;