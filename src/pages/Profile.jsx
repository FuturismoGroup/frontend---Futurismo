import { useState } from 'react';
// import FreelanceAvailabilityView from '../components/common/FreelanceAvailabilityView';
import { UserIcon, CalendarIcon, BuildingOfficeIcon, PhoneIcon, CreditCardIcon, ShieldCheckIcon, DocumentTextIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore';
import CompanyDataSection from '../components/profile/CompanyDataSection';
import ContactDataSection from '../components/profile/ContactDataSection';
import PaymentDataSection from '../components/profile/PaymentDataSection';
import FreelancerPersonalDataSection from '../components/profile/FreelancerPersonalDataSection';
import FreelancerProfessionalDataSection from '../components/profile/FreelancerProfessionalDataSection';
import FreelancerBankingDataSection from '../components/profile/FreelancerBankingDataSection';
import AdminCompanyDataSection from '../components/profile/AdminCompanyDataSection';
import AdminContactDataSection from '../components/profile/AdminContactDataSection';
import AdminPaymentDataSection from '../components/profile/AdminPaymentDataSection';
import AdminGuidesBankingSection from '../components/profile/AdminGuidesBankingSection';
import AccountStatusSection from '../components/profile/AccountStatusSection';
import FeedbackSection from '../components/profile/FeedbackSectionSimple';
import ChangePasswordSection from '../components/profile/ChangePasswordSection';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, logout } = useAuthStore();
  const { t } = useTranslation();

  // Verificar si es admin (acepta ambas variantes)
  const isAdminRole = user?.role === 'admin' || user?.role === 'administrator';

  // Configurar tabs - Secciones dinámicas según el rol
  const getTabsForRole = () => {
    const baseSections = isAdminRole
      ? ['company', 'contact', 'payment', 'feedback']
      : user?.role === 'agency'
      ? ['company', 'contact', 'payment', 'status']
      : ['company', 'contact', 'payment'];
    const sections = (user?.role === 'agency') 
      ? [...baseSections, 'feedback'] 
      : baseSections;
      
    const tabsList = [
      { id: 'profile', name: t('profile.myProfile'), icon: UserIcon, sections }
    ];
    
    // Disponibilidad de guías - Deshabilitado para todos los roles
    // if (user?.role === 'guide') {
    //   tabsList.push({ id: 'guides', name: t('profile.guideAvailability'), icon: CalendarIcon });
    // }
    
    
    return tabsList;
  };

  const tabs = getTabsForRole();

  // Función para generar el encabezado según el rol
  const getProfileHeader = () => {
    const roleLabels = {
      'agency': {
        title: t('profile.agencyProfile'),
        subtitle: t('profile.manageAgencyInfo'),
        gradient: 'from-blue-600 to-purple-600'
      },
      'guide': {
        title: t('profile.guideProfile'),
        subtitle: t('profile.manageGuideInfo'),
        gradient: 'from-green-600 to-teal-600'
      },
      'admin': {
        title: t('profile.adminProfile'),
        subtitle: t('profile.manageAdminInfo'),
        gradient: 'from-red-600 to-pink-600'
      },
      'default': {
        title: t('profile.myProfile'),
        subtitle: t('profile.manageAdminInfo'),
        gradient: 'from-gray-600 to-blue-600'
      }
    };

    // Normalizar rol para buscar configuración
    const roleKey = isAdminRole ? 'admin' : user?.role;
    const config = roleLabels[roleKey] || roleLabels.default;
    
    return (
      <div className={`bg-gradient-to-r ${config.gradient} rounded-lg p-4 sm:p-6 text-white`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-center sm:text-left">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2 break-words">{config.title}</h2>
            <p className="text-xs sm:text-sm text-blue-100 opacity-90">{config.subtitle}</p>
          </div>
          <div className="text-center sm:text-right flex-shrink-0">
            <p className="text-xs sm:text-sm text-blue-100 opacity-75">{t('profile.activeUser')}</p>
            <p className="text-base sm:text-lg font-semibold break-words">{user?.name || 'Usuario'}</p>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center sm:text-left break-words">{t('profile.administration')}</h1>
      
      {/* Tabs */}
      <div className="mb-6 sm:mb-8">
        <nav className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center justify-center sm:justify-start px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.id === 'profile' ? 'Perfil' : 'Guías'}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Header del perfil - dinámico según el rol */}
          {getProfileHeader()}

          {/* Componentes específicos por rol */}
          {isAdminRole && (
            <>
              <AdminCompanyDataSection />
              <AdminContactDataSection />
              <AdminPaymentDataSection />
              <AdminGuidesBankingSection />
              <FeedbackSection userRole="admin" />
              <ChangePasswordSection />
            </>
          )}

          {user?.role === 'agency' && (
            <>
              <CompanyDataSection />
              <ContactDataSection />
              <PaymentDataSection />
              <ChangePasswordSection />
            </>
          )}

          {user?.role === 'guide' && (
            <>
              <FreelancerPersonalDataSection />
              <FreelancerProfessionalDataSection />
              <FreelancerBankingDataSection />
              <ChangePasswordSection />
            </>
          )}

          {/* Estado de la cuenta - Solo para agencias */}
          {user?.role === 'agency' && <AccountStatusSection />}

          {/* Opiniones y sugerencias - Solo para agencias */}
          {user?.role === 'agency' && (
            <FeedbackSection userRole={user?.role} />
          )}

        </div>
      )}

      {/* Disponibilidad de guías - Deshabilitado */}
      {/* {activeTab === 'guides' && user?.role === 'guide' && (
        <FreelanceAvailabilityView />
      )} */}

    </div>
  );
};

export default Profile;