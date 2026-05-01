import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  XMarkIcon,
  UserGroupIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import { formatters } from '../../utils/formatters';

const ChatHeader = ({ chat, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
      {/* Lado izquierdo - Info del chat */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Botón volver en móvil */}
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors lg:hidden"
          aria-label={t('chat.back')}
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </button>

        {/* Avatar */}
        {chat.type === 'group' ? (
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
              <UserGroupIcon className="w-6 h-6 text-white" />
            </div>
            {chat.online && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
            )}
          </div>
        ) : (
          <div className="relative flex-shrink-0">
            <img
              src={chat.avatar}
              alt={chat.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-md"
            />
            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
              chat.online ? 'bg-emerald-500' : 'bg-slate-400'
            }`} />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 truncate">
              {chat.name}
            </h3>
            {chat.isFromAgenda && (
              <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full shadow-sm">
                {t('chat.coordination')}
              </span>
            )}
          </div>

          <p className="text-xs text-slate-500 truncate">
            {chat.isFromAgenda ? (
              <span className="text-slate-500">{t('chat.fromAgendaDescription')}</span>
            ) : chat.typing && chat.typingUser ? (
              <span className="text-blue-600 font-medium flex items-center gap-1">
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
                  <span className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
                </span>
                {t(chat.typingUser)}
              </span>
            ) : chat.online ? (
              <span className="text-emerald-600 font-medium">{t('chat.online')}</span>
            ) : (
              <span>
                {t('chat.lastSeen', { time: formatters.formatRelativeTime(chat.lastMessageTime) })}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Lado derecho - Cerrar conversación */}
      <button
        onClick={onClose}
        className="p-2.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
        aria-label={t('chat.close')}
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

ChatHeader.propTypes = {
  chat: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['guide', 'client', 'group', 'direct']).isRequired,
    avatar: PropTypes.string,
    online: PropTypes.bool,
    typing: PropTypes.bool,
    typingUser: PropTypes.string,
    isFromAgenda: PropTypes.bool,
    lastMessageTime: PropTypes.instanceOf(Date)
  }).isRequired,
  onClose: PropTypes.func.isRequired
};

export default ChatHeader;
