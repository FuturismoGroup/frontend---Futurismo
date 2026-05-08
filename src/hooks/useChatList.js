import { useState, useEffect, useCallback, useRef } from 'react';
import i18next from 'i18next';
import { useAuthStore } from '../stores/authStore';
import chatService from '../services/chatService';
import webSocketService from '../services/websocket';

const useChatList = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const chatsRef = useRef(chats);
  chatsRef.current = chats;

  const loadChats = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await chatService.getConversations(user.id);

      // Transform conversations to chat format
      const transformedChats = response.data.map(conv => {
        // Get other participant (not current user)
        const otherParticipant = conv.participants?.find(p => p.id !== user.id);

        return {
          id: conv.id,
          name: conv.name || otherParticipant?.name || 'Usuario',
          type: conv.chatType === 'group' ? 'group' : 'direct',
          avatar: otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || 'User')}&background=3B82F6&color=fff`,
          lastMessage: conv.lastMessage?.content || i18next.t('common.noData'),
          lastMessageTime: conv.lastMessage?.createdAt ? new Date(conv.lastMessage.createdAt) : new Date(conv.createdAt),
          unreadCount: conv.unreadCount || 0,
          online: otherParticipant ? onlineUsers.has(otherParticipant.id) : false,
          typing: false,
          members: conv.chatType === 'group' ? conv.participants?.length : undefined,
          participantId: otherParticipant?.id,
          // Store original conversation data
          _conversationData: conv
        };
      });

      setChats(transformedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
      setChats([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, onlineUsers]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Inicializar onlineUsers con el snapshot cacheado por el WebSocket service.
  // El backend manda presence:initial al conectar el socket (en el login),
  // por lo que al montar este hook ese evento ya pasó y hay que leer el cache.
  useEffect(() => {
    const cached = webSocketService.getOnlineUserIds();
    if (cached.length > 0) {
      setOnlineUsers(new Set(cached));
    }
  }, []);

  // WebSocket: Escuchar eventos para actualizar lista de chats
  useEffect(() => {
    // Escuchar nuevos mensajes para actualizar ultimo mensaje
    const unsubMessage = webSocketService.on('chat:message:new', (data) => {
      // Si la conversación no existe en la lista, recargar desde backend
      if (!chatsRef.current.some(chat => chat.id === data.chatId)) {
        loadChats();
        return;
      }

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== data.chatId) return chat;

          return {
            ...chat,
            lastMessage: data.message.content,
            lastMessageTime: new Date(data.message.createdAt),
            // Incrementar unread solo si el mensaje no es del usuario actual
            unreadCount:
              data.message.senderId !== user?.id
                ? chat.unreadCount + 1
                : chat.unreadCount
          };
        })
      );
    });

    // Escuchar actualizaciones de unread count + preview del mensaje
    const unsubUnread = webSocketService.on('unread:update', (data) => {
      // Si la conversación no existe en la lista, recargar desde backend
      if (!chatsRef.current.some(chat => chat.id === data.chatId)) {
        loadChats();
        return;
      }

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== data.chatId) return chat;

          const updates = {
            ...chat,
            unreadCount: data.count !== undefined ? data.count : chat.unreadCount + (data.increment || 0)
          };

          // Actualizar preview del último mensaje si viene incluido
          if (data.lastMessage) {
            updates.lastMessage = data.lastMessage.content;
            updates.lastMessageTime = new Date(data.lastMessage.createdAt);
          }

          return updates;
        })
      );
    });

    // Escuchar cuando se marcan mensajes como leidos
    const unsubRead = webSocketService.on('chat:read:update', (data) => {
      // Si el usuario actual marco como leido, resetear contador
      if (data.userId === user?.id) {
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === data.chatId ? { ...chat, unreadCount: 0 } : chat
          )
        );
      }
    });

    // Snapshot inicial de presencia: usuarios que ya estaban online al conectar
    const unsubInitial = webSocketService.on('presence:initial', (data) => {
      const ids = Array.isArray(data?.onlineUserIds) ? data.onlineUserIds : [];
      setOnlineUsers(new Set(ids));
      setChats((prev) =>
        prev.map((chat) =>
          ids.includes(chat.participantId) ? { ...chat, online: true } : chat
        )
      );
    });

    // Escuchar usuarios online
    const unsubOnline = webSocketService.on('user:online', (data) => {
      setOnlineUsers((prev) => new Set([...prev, data.userId]));
      setChats((prev) =>
        prev.map((chat) =>
          chat.participantId === data.userId ? { ...chat, online: true } : chat
        )
      );
    });

    // Escuchar usuarios offline
    const unsubOffline = webSocketService.on('user:offline', (data) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
      setChats((prev) =>
        prev.map((chat) =>
          chat.participantId === data.userId ? { ...chat, online: false } : chat
        )
      );
    });

    // Escuchar typing indicators
    const unsubTyping = webSocketService.on('chat:typing', (data) => {
      if (data.userId === user?.id) return;

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === data.chatId ? { ...chat, typing: data.isTyping } : chat
        )
      );

      // Auto-remover typing despues de 5 segundos
      if (data.isTyping) {
        setTimeout(() => {
          setChats((prev) =>
            prev.map((chat) =>
              chat.id === data.chatId ? { ...chat, typing: false } : chat
            )
          );
        }, 5000);
      }
    });

    return () => {
      unsubMessage();
      unsubUnread();
      unsubRead();
      unsubInitial();
      unsubOnline();
      unsubOffline();
      unsubTyping();
    };
  }, [user?.id]);

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (chat) => {
    if (chat.type === 'group') return null;
    return chat.online;
  };

  const getMessageStatus = (chat) => {
    if (chat.unreadCount > 0) return null;
    if (chat.type === 'client' || chat.type === 'group') return null;
    return 'delivered';
  };

  // Limpiar contador de no leidos cuando se selecciona un chat
  const markChatAsRead = useCallback((chatId) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    filteredChats,
    getStatusIcon,
    getMessageStatus,
    refreshChats: loadChats,
    loading,
    markChatAsRead,
    onlineUsers
  };
};

export default useChatList;
