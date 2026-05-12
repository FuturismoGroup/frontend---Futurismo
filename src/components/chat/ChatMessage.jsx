import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { CheckIcon } from '@heroicons/react/24/outline';
import { formatters } from '../../utils/formatters';
import { resolveFileUrl } from '../../utils/fileUrl';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return name.charAt(0).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-blue-500',
    'from-teal-500 to-green-500',
    'from-red-500 to-orange-500'
  ];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

const ChatMessage = ({ message, isCurrentUser, isGroup, senderAvatar }) => {
  const { t } = useTranslation();
  const isSystemMessage = message.type === 'system';

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-4 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 rounded-full blur-md"></div>
          <div className="relative bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-full px-5 py-2 shadow-sm">
            <p className="text-sm text-slate-600 text-center font-medium">
              {message.contentData
                ? t(message.content, message.contentData)
                : t(message.content)
              }
            </p>
            <div className="text-[10px] text-slate-400 text-center mt-0.5 font-medium tracking-wide">
              {formatters.formatTime(message.timestamp)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderMessageStatus = () => {
    if (!isCurrentUser) return null;

    return (
      <span className="ml-1.5 flex items-center">
        {message.status === 'sent' && (
          <CheckIcon className="w-3.5 h-3.5 text-white/60" />
        )}
        {message.status === 'delivered' && (
          <div className="flex -space-x-1">
            <CheckIcon className="w-3.5 h-3.5 text-white/70" />
            <CheckIcon className="w-3.5 h-3.5 text-white/70" />
          </div>
        )}
        {message.status === 'read' && (
          <div className="flex -space-x-1">
            <CheckIcon className="w-3.5 h-3.5 text-cyan-300" />
            <CheckIcon className="w-3.5 h-3.5 text-cyan-300" />
          </div>
        )}
      </span>
    );
  };

  return (
    <div
      className={`flex items-end gap-2 mb-3 animate-slide-up ${
        isCurrentUser ? 'justify-end pl-12' : 'justify-start pr-12'
      }`}
    >
      {/* Avatar del remitente (solo para mensajes recibidos) */}
      {!isCurrentUser && (
        <div className="flex-shrink-0 mb-1">
          {senderAvatar ? (
            <img
              src={resolveFileUrl(senderAvatar)}
              alt={message.senderName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-md"
            />
          ) : (
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(message.senderName)} flex items-center justify-center ring-2 ring-white shadow-md`}>
              <span className="text-white font-bold text-xs">
                {getInitials(message.senderName)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Contenedor del mensaje */}
      <div className={`max-w-[75%] ${isCurrentUser ? 'order-1' : 'order-2'}`}>
        {/* Nombre del remitente (solo en grupos y mensajes recibidos) */}
        {!isCurrentUser && isGroup && (
          <p className="text-xs font-semibold text-slate-500 mb-1 ml-3 tracking-wide">
            {message.senderName}
          </p>
        )}

        {/* Burbuja del mensaje */}
        <div className={`relative group ${
          isCurrentUser
            ? 'chat-bubble-sent'
            : 'chat-bubble-received'
        }`}>
          <div className={`relative rounded-2xl px-4 py-2.5 shadow-sm ${
            isCurrentUser
              ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-br-md'
              : 'bg-white text-slate-800 rounded-bl-md border border-slate-100 shadow-md'
          }`}>
            {/* Cola de la burbuja */}
            <div className={`absolute bottom-0 w-3 h-3 ${
              isCurrentUser
                ? 'right-0 translate-x-1 bg-indigo-600'
                : 'left-0 -translate-x-1 bg-white border-l border-b border-slate-100'
            }`} style={{
              clipPath: isCurrentUser
                ? 'polygon(0 0, 100% 100%, 0 100%)'
                : 'polygon(100% 0, 100% 100%, 0 100%)'
            }}></div>

            {/* Texto del mensaje */}
            <p className={`text-[15px] leading-relaxed whitespace-pre-wrap break-words ${
              isCurrentUser ? 'text-white' : 'text-slate-700'
            }`}>
              {message.content?.startsWith('chat.')
                ? t(message.content)
                : message.content
              }
            </p>

            {/* Hora y estado */}
            <div className={`flex items-center gap-1 mt-1.5 ${
              isCurrentUser ? 'justify-end' : 'justify-start'
            }`}>
              <span className={`text-[10px] font-medium tracking-wide ${
                isCurrentUser ? 'text-white/70' : 'text-slate-400'
              }`}>
                {formatters.formatTime(message.timestamp)}
              </span>
              {renderMessageStatus()}
            </div>
          </div>
        </div>
      </div>

      {/* Espacio para mantener alineación en mensajes enviados */}
      {isCurrentUser && <div className="w-8 flex-shrink-0"></div>}
    </div>
  );
};

ChatMessage.propTypes = {
  message: PropTypes.shape({
    id: PropTypes.string.isRequired,
    senderId: PropTypes.string.isRequired,
    senderName: PropTypes.string.isRequired,
    content: PropTypes.string,
    contentData: PropTypes.object,
    timestamp: PropTypes.instanceOf(Date).isRequired,
    type: PropTypes.oneOf(['text', 'system']).isRequired,
    status: PropTypes.oneOf(['sent', 'delivered', 'read'])
  }).isRequired,
  isCurrentUser: PropTypes.bool.isRequired,
  isGroup: PropTypes.bool.isRequired,
  senderAvatar: PropTypes.string
};

export default ChatMessage;
