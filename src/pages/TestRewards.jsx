import React from 'react';
import { useTranslation } from 'react-i18next';

const TestRewards = () => {
  const { t } = useTranslation();

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-purple-600 mb-4">
        🎁 {t('rewards.test.title')}
      </h1>
      <p className="text-gray-600">
        {t('rewards.test.description')}
      </p>
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <h2 className="text-lg font-semibold text-green-800 mb-2">✅ {t('rewards.test.implementedTitle')}</h2>
        <ul className="text-green-700 space-y-1">
          <li>• {t('rewards.test.itemConstants')} (/src/constants/rewardsConstants.js)</li>
          <li>• {t('rewards.test.itemStore')} (/src/stores/rewardsStore.js)</li>
          <li>• {t('rewards.test.itemAdmin')} (/src/pages/admin/RewardsManagement.jsx)</li>
          <li>• {t('rewards.test.itemAgency')} (/src/pages/agency/RewardsStore.jsx)</li>
          <li>• {t('rewards.test.itemRoutes')}</li>
          <li>• {t('rewards.test.itemSidebar')}</li>
        </ul>
      </div>
    </div>
  );
};

export default TestRewards;
