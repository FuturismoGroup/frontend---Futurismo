import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import i18next from 'i18next';
import { useAuthStore } from '../stores/authStore';
import chatService from '../services/chatService';
import webSocketService from '../services/websocket';

const useChatContainer = () => {
  const { user } = useAuthStore();
  const [selectedChat, setSelectedChat] = useState(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    if (window.innerWidth < 1024) {
      setIsMobileView(true);
    }
  };

  // Mantener selectedChat.online sincronizado con la presencia en tiempo real.
  // Sin esto, el estado online del header queda congelado en el momento en que
  // se seleccionó el chat y nunca refleja conexiones/desconexiones posteriores.
  useEffect(() => {
    const applyOnline = (online) => (data) => {
      const targetId = data?.userId;
      if (!targetId) return;
      setSelectedChat((prev) => {
        if (!prev || prev.participantId !== targetId) return prev;
        return { ...prev, online };
      });
    };

    const applyInitial = (data) => {
      const ids = Array.isArray(data?.onlineUserIds) ? data.onlineUserIds : [];
      setSelectedChat((prev) => {
        if (!prev || !prev.participantId) return prev;
        return { ...prev, online: ids.includes(prev.participantId) };
      });
    };

    // Hidratar con el snapshot cacheado: el WebSocket pudo haberse conectado
    // antes de que este hook montara, perdiendo el evento presence:initial.
    const cachedIds = webSocketService.getOnlineUserIds();
    if (cachedIds.length > 0) {
      applyInitial({ onlineUserIds: cachedIds });
    }

    const unsubInitial = webSocketService.on('presence:initial', applyInitial);
    const unsubOnline = webSocketService.on('user:online', applyOnline(true));
    const unsubOffline = webSocketService.on('user:offline', applyOnline(false));

    return () => {
      unsubInitial();
      unsubOnline();
      unsubOffline();
    };
  }, []);

  const handleCloseChat = () => {
    setSelectedChat(null);
    setIsMobileView(false);
    // Clear URL parameters when closing chat
    setSearchParams({});
  };

  // Effect to handle URL parameters (when coming from agenda)
  useEffect(() => {
    const createOrFindConversation = async () => {
      const guideId = searchParams.get('guide');
      const guideName = searchParams.get('name');

      if (!guideId || !guideName || !user?.id) return;

      setCreatingConversation(true);
      try {
        // Try to create conversation (backend will return existing if already exists)
        const response = await chatService.createConversation({
          participants: [user.id, guideId],
          type: 'direct'
        });

        // Transform to chat format
        const conversation = response.data;
        const otherParticipant = conversation.participants?.find(p => p.user_id === guideId);

        const guideChat = {
          id: conversation.id,
          type: 'guide',
          name: decodeURIComponent(guideName),
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(guideName)}&background=3B82F6&color=fff`,
          lastMessage: conversation.last_message?.content || i18next.t('chat.sendMessage', { defaultValue: 'Iniciar conversación' }),
          lastMessageTime: conversation.last_message ? new Date(conversation.last_message.created_at) : new Date(),
          unreadCount: 0,
          participantId: guideId,
          online: webSocketService.getOnlineUserIds().includes(guideId),
          typing: false,
          isFromAgenda: true,
          _conversationData: conversation
        };

        setSelectedChat(guideChat);
        // Trigger refresh of chat list
        setRefreshTrigger(prev => prev + 1);
        if (window.innerWidth < 1024) {
          setIsMobileView(true);
        }
      } catch (error) {
        console.error('Error creating/finding conversation:', error);
        // Fallback to temporary chat if error
        const guideChat = {
          id: `temp-${guideId}`,
          type: 'guide',
          name: decodeURIComponent(guideName),
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(guideName)}&background=3B82F6&color=fff`,
          lastMessage: i18next.t('errors.unexpectedError'),
          lastMessageTime: new Date(),
          unreadCount: 0,
          online: false,
          typing: false,
          isFromAgenda: true
        };
        setSelectedChat(guideChat);
      } finally {
        setCreatingConversation(false);
      }
    };

    createOrFindConversation();
  }, [searchParams, user?.id]);

  const handleCreateNewChat = async (userId, userName) => {
    if (!user?.id) return;

    setCreatingConversation(true);
    try {
      // Create or get existing conversation with the selected guide
      const response = await chatService.createConversation({
        participants: [user.id, userId],
        type: 'direct'
      });

      const conversation = response.data;

      // Transform to chat format
      const newChat = {
        id: conversation.id,
        type: 'direct',
        name: userName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3B82F6&color=fff`,
        lastMessage: conversation.last_message?.content || i18next.t('chat.sendMessage', { defaultValue: 'Iniciar conversación' }),
        lastMessageTime: conversation.last_message ? new Date(conversation.last_message.created_at) : new Date(),
        unreadCount: 0,
        participantId: userId,
        online: webSocketService.getOnlineUserIds().includes(userId),
        typing: false,
        _conversationData: conversation
      };

      setSelectedChat(newChat);
      // Trigger refresh of chat list
      setRefreshTrigger(prev => prev + 1);
      if (window.innerWidth < 1024) {
        setIsMobileView(true);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      // Fallback to temporary chat if error
      const newChat = {
        id: `temp-${userId}`,
        type: 'direct',
        name: userName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3B82F6&color=fff`,
        lastMessage: i18next.t('errors.unexpectedError'),
        lastMessageTime: new Date(),
        unreadCount: 0,
        online: false,
        typing: false
      };
      setSelectedChat(newChat);
    } finally {
      setCreatingConversation(false);
    }
  };

  return {
    selectedChat,
    isMobileView,
    handleSelectChat,
    handleCloseChat,
    handleCreateNewChat,
    creatingConversation,
    refreshTrigger
  };
};

export default useChatContainer;