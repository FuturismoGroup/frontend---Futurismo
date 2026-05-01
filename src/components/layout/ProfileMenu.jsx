import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ChevronDownIcon, 
  ArrowRightOnRectangleIcon, 
  UserIcon
} from '@heroicons/react/24/outline';

const ProfileMenu = ({ user, viewport, onLogout }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setIsOpen(false);
    onLogout();
  };

  const getUserInitials = () => {
    if (!user?.name) return 'U';
    const names = user.name.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  };

  const getUserName = () => {
    return user?.name || t('common.user');
  };

  const getFirstName = () => {
    if (!user?.name) return t('common.user');
    return user.name.trim().split(' ')[0];
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 touch-manipulation group"
      >
        <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-sm ring-2 ring-white group-hover:ring-blue-100 transition-all">
          <span className="text-white text-sm font-semibold tracking-tight">
            {getUserInitials()}
          </span>
        </div>
        {!viewport.isMobile && (
          <>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
              {getFirstName()}
            </span>
            <ChevronDownIcon className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-all duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} />
          </>
        )}
      </button>

      {isOpen && (
        <div className={`
          absolute right-0 mt-2 w-56 sm:w-48 bg-white rounded-xl sm:rounded-lg 
          shadow-lg border border-gray-200 py-2 z-50
          ${viewport.isMobile ? 'mr-2' : ''}
        `}>
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 truncate">
              {getUserName()}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || t('common.user')}
            </p>
          </div>
          
          <button
            onClick={() => {
              navigate('/profile');
              setIsOpen(false);
            }}
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 w-full transition-colors touch-manipulation"
          >
            <UserIcon className="w-5 h-5 mr-3 text-gray-400" />
            {t('profile.myProfile')}
          </button>
          
          <div className="border-t border-gray-100 my-1" />
          
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 active:bg-red-100 w-full transition-colors touch-manipulation"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3 text-red-500" />
            {t('profile.logout')}
          </button>
        </div>
      )}
    </div>
  );
};

ProfileMenu.propTypes = {
  user: PropTypes.object,
  viewport: PropTypes.object.isRequired,
  onLogout: PropTypes.func.isRequired
};

export default ProfileMenu;