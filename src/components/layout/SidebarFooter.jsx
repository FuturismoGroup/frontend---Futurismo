import React from 'react';
import { useTranslation } from 'react-i18next';
import { APP_NAME, APP_YEAR } from '../../constants/layoutConstants';

const SidebarFooter = () => {
  const { t } = useTranslation();

  return (
    <div className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
      <div className="text-center">
        <p className="text-xs sm:text-xs text-gray-500 leading-relaxed">
          © {APP_YEAR} {APP_NAME}. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};

export default SidebarFooter;