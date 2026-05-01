import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import useChatContainer from '../../hooks/useChatContainer';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

const ChatContainer = () => {
  const { t } = useTranslation();
  const {
    selectedChat,
    isMobileView,
    handleSelectChat,
    handleCloseChat,
    handleCreateNewChat,
    refreshTrigger
  } = useChatContainer();

  return (
    <div className="flex h-full w-full bg-gray-50 rounded-lg overflow-hidden shadow-sm border border-gray-200">
      {/* Chat list - hidden on mobile when chat is selected */}
      <div className={`w-full lg:w-80 flex flex-col ${isMobileView ? 'hidden lg:block' : 'block'}`}>
        <ChatList
          onSelectChat={handleSelectChat}
          selectedChatId={selectedChat?.id}
          onCreateNewChat={handleCreateNewChat}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Chat window - visible on mobile when chat is selected */}
      <div className={`flex-1 flex flex-col ${!isMobileView && !selectedChat ? 'hidden lg:flex' : 'flex'}`}>
        {selectedChat ? (
          <ChatWindow 
            chat={selectedChat} 
            onClose={handleCloseChat}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
            <div className="text-center max-w-md px-6">
              <div className="mb-6 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
                </div>
                <div className="relative bg-white rounded-full p-6 inline-block shadow-lg">
                  <ChatBubbleLeftRightIcon className="w-20 h-20 text-blue-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                {t('chat.welcome')}
              </h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                {t('chat.selectConversation')}
              </p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{t('chat.chatWithGuides')}</h4>
                  <p className="text-xs text-gray-500">{t('chat.coordinateWithTeam')}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{t('chat.chatWithAgencies')}</h4>
                  <p className="text-xs text-gray-500">{t('chat.manageReservations')}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

ChatContainer.propTypes = {};

export default ChatContainer;