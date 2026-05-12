import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import useChatWindow from '../../hooks/useChatWindow';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { resolveFileUrl } from '../../utils/fileUrl';

const ChatWindow = ({ chat, onClose }) => {
  const { t } = useTranslation();
  const {
    message,
    setMessage,
    messages,
    messagesEndRef,
    handleSendMessage,
    currentUserId,
    typingUsers,
    sendTypingIndicator
  } = useChatWindow(chat);

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-blue-100 to-indigo-100 p-6 rounded-full">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-blue-500" />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-slate-700 mb-2">
            {t('chat.selectToStart')}
          </h3>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">
            {t('chat.selectFromList')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <ChatHeader
        chat={chat}
        onClose={onClose}
      />

      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 chat-messages-area"
        style={{
          background: `
            linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")
          `
        }}
      >
        {/* Fecha separadora */}
        {messages.length > 0 && (
          <div className="flex justify-center mb-6">
            <span className="px-4 py-1.5 bg-white/80 backdrop-blur-sm text-xs font-medium text-slate-500 rounded-full shadow-sm border border-slate-200/50">
              {t('chat.today')}
            </span>
          </div>
        )}

        {messages.map((msg) => {
          const isOwnMessage = String(msg.senderId) === String(currentUserId);
          return (
            <ChatMessage
              key={msg.id}
              message={msg}
              isCurrentUser={isOwnMessage}
              isGroup={chat.type === 'group'}
              senderAvatar={!isOwnMessage ? chat.avatar : null}
            />
          );
        })}

        {/* Indicador de escritura */}
        {typingUsers.length > 0 && (
          <div className="flex items-end gap-2 mb-3 justify-start pr-12">
            <div className="flex-shrink-0 mb-1">
              {chat.avatar ? (
                <img
                  src={resolveFileUrl(chat.avatar)}
                  alt={chat.name}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-md"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center ring-2 ring-white shadow-md">
                  <span className="text-white font-bold text-xs">
                    {typingUsers[0]?.userName?.charAt(0)?.toUpperCase() || chat.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-md border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {typingUsers.length === 1
                    ? t('chat.personTyping', { name: typingUsers[0].userName })
                    : t('chat.peopleTyping', { count: typingUsers.length })}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '600ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '600ms' }} />
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '600ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        message={message}
        setMessage={setMessage}
        onSendMessage={handleSendMessage}
        onTyping={sendTypingIndicator}
      />
    </div>
  );
};

ChatWindow.propTypes = {
  chat: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['guide', 'client', 'group', 'direct']).isRequired,
    avatar: PropTypes.string,
    online: PropTypes.bool,
    typing: PropTypes.bool,
    typingUser: PropTypes.string,
    isFromAgenda: PropTypes.bool,
    lastMessageTime: PropTypes.instanceOf(Date),
    members: PropTypes.number
  }),
  onClose: PropTypes.func.isRequired
};

export default ChatWindow;
