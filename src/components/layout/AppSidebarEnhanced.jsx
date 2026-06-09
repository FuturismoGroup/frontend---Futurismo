import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuthStore } from '../../stores/authStore';
import { useTranslation } from 'react-i18next';
import SidebarHeader from './SidebarHeader';
import SidebarFooter from './SidebarFooter';
import { 
  HomeIcon, MapIcon, CalendarIcon, ClockIcon, ChatBubbleLeftRightIcon,
  UserIcon, UserGroupIcon, DocumentTextIcon, CalendarDaysIcon,
  BuildingOffice2Icon, ShieldCheckIcon, ChartBarIcon, StarIcon,
  UserCircleIcon, CurrencyDollarIcon, MagnifyingGlassIcon,
  BriefcaseIcon, ClipboardDocumentListIcon, TruckIcon, GiftIcon,
  SignalIcon
} from '@heroicons/react/24/outline';

const AppSidebarEnhanced = () => {
  const { closeSidebar, viewport } = useLayout();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // Estructura mejorada del menú con secciones agrupadas
  const getMenuStructure = () => {
    if (user?.role === 'agency') {
      return [
        {
          section: t('navigation.sections.main'),
          items: [
            { path: '/dashboard', icon: HomeIcon, label: t('navigation.dashboard') },
            { path: '/monitoring', icon: MapIcon, label: t('navigation.monitoring') }
          ]
        },
        {
          section: t('navigation.sections.operations'),
          items: [
            { path: '/services', icon: ClipboardDocumentListIcon, label: t('navigation.services') },
            { path: '/reservations', icon: CalendarIcon, label: t('navigation.reservations') }
          ]
        },
        {
          section: t('navigation.sections.marketplace'),
          items: [
            { path: '/marketplace', icon: MagnifyingGlassIcon, label: t('navigation.searchGuides'), end: true },
            { path: '/marketplace/requests', icon: ClipboardDocumentListIcon, label: t('navigation.myRequests') },
            { path: '/agency/rewards', icon: GiftIcon, label: t('navigation.rewardsStore') }
          ]
        },
        {
          section: t('navigation.sections.analysis'),
          items: [
            { path: '/agency/reports', icon: ChartBarIcon, label: t('navigation.reports') },
            { path: '/agency/points', icon: StarIcon, label: t('navigation.points') },
            { path: '/history', icon: ClockIcon, label: t('navigation.history') }
          ]
        },
        {
          section: t('navigation.sections.communication'),
          items: [
            { path: '/chat', icon: ChatBubbleLeftRightIcon, label: t('navigation.chat') },
            { path: '/profile', icon: UserIcon, label: t('navigation.profile') }
          ]
        }
      ];
    }
    
    if (user?.role === 'guide') {
      const sections = [
        {
          section: t('navigation.sections.main'),
          items: [
            { path: '/dashboard', icon: HomeIcon, label: t('navigation.dashboard') },
            { path: '/monitoring', icon: MapIcon, label: t('navigation.monitoring') },
            { path: '/guide/dashboard', icon: ClipboardDocumentListIcon, label: t('navigation.myTours') }
          ]
        }
      ];

      // Agenda disponible para todos los guías (planta y freelance)
      sections.push({
        section: t('navigation.sections.planning'),
        items: [
          { path: '/agenda', icon: CalendarDaysIcon, label: t('navigation.myAgenda') }
        ]
      });

      if (user?.guideType === 'freelance') {
        sections.push({
          section: t('navigation.sections.myWork'),
          items: [
            { path: '/marketplace/guide-dashboard', icon: BriefcaseIcon, label: t('navigation.myServices') },
            { path: '/marketplace/guide-rate', icon: CurrencyDollarIcon, label: t('navigation.myRate') },
            { path: '/marketplace/guide-availability', icon: SignalIcon, label: t('navigation.myAvailability') }
          ]
        });
        sections.push({
          section: t('navigation.sections.finances'),
          items: [
            { path: '/guide/finances', icon: CurrencyDollarIcon, label: t('navigation.finances') }
          ]
        });
      }

      sections.push({
        section: t('navigation.sections.security'),
        items: [
          { path: '/emergency', icon: ShieldCheckIcon, label: t('navigation.emergencies') }
        ]
      });

      sections.push({
        section: t('navigation.sections.resources'),
        items: [
          { path: '/providers', icon: BuildingOffice2Icon, label: t('navigation.providers') }
        ]
      });

      sections.push({
        section: t('navigation.sections.general'),
        items: [
          { path: '/history', icon: ClockIcon, label: t('navigation.history') },
          { path: '/chat', icon: ChatBubbleLeftRightIcon, label: t('navigation.chat') },
          { path: '/profile', icon: UserIcon, label: t('navigation.profile') }
        ]
      });

      return sections;
    }

    // Admin menu
    return [
      {
        section: t('navigation.sections.main'),
        items: [
          { path: '/dashboard', icon: HomeIcon, label: t('navigation.dashboard') },
          { path: '/monitoring', icon: MapIcon, label: t('navigation.monitoring') }
        ]
      },
      {
        section: t('navigation.sections.operativeManagement'),
        items: [
          { path: '/services', icon: ClipboardDocumentListIcon, label: t('navigation.services') },
          { path: '/admin/reservations', icon: CalendarIcon, label: t('navigation.reservationManagement') },
          { path: '/assignments', icon: UserCircleIcon, label: t('navigation.assignments') },
          { path: '/clients', icon: UserGroupIcon, label: t('navigation.clients') },
          { path: '/guides', icon: UserIcon, label: t('navigation.guides') }
        ]
      },
      {
        section: t('navigation.sections.resources'),
        items: [
          { path: '/drivers', icon: TruckIcon, label: t('navigation.drivers') },
          { path: '/vehicles', icon: TruckIcon, label: t('navigation.vehicles') },
          { path: '/providers', icon: BuildingOffice2Icon, label: t('navigation.providers') }
        ]
      },
      {
        section: t('navigation.sections.marketplace'),
        items: [
          { path: '/marketplace', icon: MagnifyingGlassIcon, label: t('navigation.marketplace'), end: true },
          { path: '/admin/rewards', icon: GiftIcon, label: t('navigation.rewardsSystem') }
        ]
      },
      {
        section: t('navigation.sections.securityControl'),
        items: [
          { path: '/emergency', icon: ShieldCheckIcon, label: t('navigation.emergencies') },
          { path: '/agenda', icon: CalendarDaysIcon, label: t('navigation.guideAgenda') }
        ]
      },
      {
        section: t('navigation.sections.analysis'),
        items: [
          { path: '/admin/reports', icon: ChartBarIcon, label: t('navigation.reports') },
          { path: '/history', icon: DocumentTextIcon, label: t('navigation.history') }
        ]
      },
      {
        section: t('navigation.sections.administration'),
        items: [
          { path: '/users', icon: UserGroupIcon, label: t('navigation.users') },
          { path: '/admin/terms', icon: DocumentTextIcon, label: t('navigation.terms') },
          { path: '/chat', icon: ChatBubbleLeftRightIcon, label: t('navigation.chat') },
          { path: '/profile', icon: UserIcon, label: t('navigation.profile') }
        ]
      }
    ];
  };

  const menuStructure = getMenuStructure();

  const handleNavClick = () => {
    if (viewport.isCompact) {
      closeSidebar();
    }
  };

  return (
    <div className="h-full bg-white shadow-xl lg:shadow-lg flex flex-col overflow-hidden">
      <SidebarHeader
        isCompact={viewport.isCompact}
        onClose={closeSidebar}
      />

      {/* Navigation con scroll mejorado */}
      <nav className="flex-1 px-2 sm:px-3 lg:px-4 py-3 sm:py-4 overflow-y-auto overscroll-contain min-h-0">
        <div className="space-y-6 sm:space-y-8">
          {menuStructure.map((section, sectionIndex) => (
            <div key={section.section}>
              {/* Título de sección */}
              <h3 className="px-2 sm:px-3 mb-2 sm:mb-3 text-xs sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.section}
              </h3>
              
              {/* Items de la sección */}
              <ul className="space-y-0.5 sm:space-y-1">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.end}
                      onClick={handleNavClick}
                      className={({ isActive }) => `
                        flex items-center gap-2.5 sm:gap-3 px-2 sm:px-3 py-2.5 sm:py-3 
                        rounded-xl sm:rounded-lg transition-all duration-200 
                        touch-manipulation group relative
                        ${isActive 
                          ? 'bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100' 
                          : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon className={`
                            w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0
                            transition-all duration-200
                            ${isActive 
                              ? 'text-blue-600 scale-110' 
                              : 'text-gray-400 group-hover:text-gray-600 group-hover:scale-105'
                            }
                          `} />
                          <span className="font-medium text-sm sm:text-sm truncate flex-1 min-w-0">
                            {item.label}
                          </span>
                          {isActive && (
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-blue-600 rounded-full" />
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
              
              {/* Separador entre secciones (excepto la última) */}
              {sectionIndex < menuStructure.length - 1 && (
                <div className="mt-4 sm:mt-6 border-t border-gray-100"></div>
              )}
            </div>
          ))}
        </div>
      </nav>

      <SidebarFooter />
    </div>
  );
};

export default AppSidebarEnhanced;