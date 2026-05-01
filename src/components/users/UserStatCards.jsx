import React from 'react';
import {
  UserGroupIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  UserIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const UserStatCards = ({ roleStats }) => {
  const { t } = useTranslation();

  const statCards = [
    {
      title: t('users.stats.totalUsers'),
      value: roleStats.total || 0,
      icon: UserGroupIcon,
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600'
    },
    {
      title: t('users.stats.administrators'),
      value: roleStats.administradores || 0,
      icon: ShieldCheckIcon,
      gradient: 'from-red-500 to-rose-600',
      bgLight: 'bg-red-50',
      textColor: 'text-red-600'
    },
    {
      title: t('users.stats.agencies'),
      value: roleStats.agencias || 0,
      icon: BuildingOfficeIcon,
      gradient: 'from-violet-500 to-purple-600',
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-600'
    },
    {
      title: t('users.stats.totalGuides'),
      value: roleStats.guias || 0,
      icon: UserIcon,
      gradient: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl ${stat.bgLight}`}>
                <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.title}</p>
            </div>
          </div>
          <div className={`h-1 bg-gradient-to-r ${stat.gradient}`} />
        </div>
      ))}

      {/* Planta / Freelance card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-xl bg-amber-50">
              <UsersIcon className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">{roleStats.guiasPlanta || 0}</span>
              <span className="text-gray-400 text-sm">/</span>
              <span className="text-2xl font-bold text-gray-900">{roleStats.guiasFreelance || 0}</span>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{t('users.stats.plantFreelance')}</p>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-600" />
      </div>
    </div>
  );
};

export default UserStatCards;
