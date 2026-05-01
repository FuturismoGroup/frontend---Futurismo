import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import chatService from '../services/chatService';
import webSocketService from '../services/websocket';
import { MESSAGE_TYPES, MESSAGE_STATUS } from '../constants/chatWindowConstants';

/**
 * Hook para manejar la ventana de chat (solo texto plano)
 * @param {Object} chat - Datos del chat activo
 * @returns {Object} Estado y funciones del chat
 */
const useChatWindow = (chat) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load messages from backend
  useEffect(() => {
    const loadMessages = async () => {
      if (!chat?.id) {
        setMessages([]);
        return;
      }

      if (chat.id.startsWith('temp-')) {
        setMessages([]);
        return;
      }

      setLoading(true);
      try {
        const response = await chatService.getMessages(chat.id);

        const transformedMessages = response.data.map(msg => ({
          id: msg.id,
          senderId: msg.senderId || msg.sender_id,
          senderName: msg.senderName || msg.sender?.name || 'Usuario',
          content: msg.content,
          timestamp: new Date(msg.createdAt || msg.created_at),
          type: msg.messageType || msg.message_type || MESSAGE_TYPES.TEXT,
          status: (msg.sender_id === user?.id || msg.senderId === user?.id)
            ? MESSAGE_STATUS.SENT
            : MESSAGE_STATUS.READ,
          _originalData: msg
        })).reverse();

        setMessages(transformedMessages);

        if (transformedMessages.length > 0 && user?.id) {
          await chatService.markAsRead(chat.id, user.id);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [chat?.id, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // WebSocket: Unirse a la room del chat y escuchar eventos
  useEffect(() => {
    if (!chat?.id || chat.id.startsWith('temp-')) return;

    webSocketService.joinChatRoom(chat.id);

    // Escuchar nuevos mensajes (solo de otros usuarios)
    const unsubMessage = webSocketService.on('chat:message:new', (data) => {
      if (data.chatId !== chat.id) return;

      const newMsg = data.message;

      // Ignorar mensajes propios: ya se agregaron al estado via REST response
      if (String(newMsg.senderId) === String(user?.id)) return;

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === newMsg.id);
        if (exists) return prev;

        return [
          ...prev,
          {
            id: newMsg.id,
            senderId: newMsg.senderId,
            senderName: newMsg.senderName,
            content: newMsg.content,
            timestamp: new Date(newMsg.createdAt),
            type: newMsg.messageType || MESSAGE_TYPES.TEXT,
            status: MESSAGE_STATUS.SENT,
            _originalData: newMsg
          }
        ];
      });
    });

    // Escuchar typing indicators
    const unsubTyping = webSocketService.on('chat:typing', (data) => {
      if (data.chatId !== chat.id || data.userId === user?.id) return;

      setTypingUsers((prev) => {
        if (data.isTyping) {
          if (!prev.some((u) => u.userId === data.userId)) {
            return [...prev, { userId: data.userId, userName: data.userName }];
          }
          return prev;
        } else {
          return prev.filter((u) => u.userId !== data.userId);
        }
      });

      setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u.userId !== data.userId));
      }, 5000);
    });

    // Escuchar cuando otros leen los mensajes
    const unsubRead = webSocketService.on('chat:read:update', (data) => {
      if (data.chatId !== chat.id) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.senderId === user?.id && m.status !== MESSAGE_STATUS.READ
            ? { ...m, status: MESSAGE_STATUS.READ }
            : m
        )
      );
    });

    webSocketService.markAsRead(chat.id);

    return () => {
      webSocketService.leaveChatRoom(chat.id);
      unsubMessage();
      unsubTyping();
      unsubRead();
    };
  }, [chat?.id, user?.id]);

  // Enviar typing indicator con debounce
  const sendTypingIndicator = useCallback(
    (isTyping) => {
      if (!chat?.id || chat.id.startsWith('temp-')) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      webSocketService.sendTypingIndicator(chat.id, isTyping);

      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          webSocketService.sendTypingIndicator(chat.id, false);
        }, 3000);
      }
    },
    [chat?.id]
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSendMessage = useCallback(async (e) => {
    e.preventDefault();
    if (!message.trim() || !chat?.id || !user?.id || sending) return;

    if (chat.id.startsWith('temp-')) return;

    const messageContent = message;
    setMessage('');
    setSending(true);

    try {
      const response = await chatService.sendMessage(chat.id, {
        sender_id: user.id,
        content: messageContent,
        message_type: MESSAGE_TYPES.TEXT
      });

      const newMessage = {
        id: response.data.id,
        senderId: response.data.senderId || response.data.sender_id,
        senderName: response.data.senderName || user.name || 'You',
        content: response.data.content,
        timestamp: new Date(response.data.createdAt || response.data.created_at),
        type: MESSAGE_TYPES.TEXT,
        status: MESSAGE_STATUS.SENT,
        _originalData: response.data
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setMessage(messageContent);
    } finally {
      setSending(false);
    }
  }, [message, chat?.id, user?.id, user?.name, sending]);

  return {
    message,
    setMessage,
    messages,
    messagesEndRef,
    handleSendMessage,
    loading,
    sending,
    currentUserId: user?.id,
    typingUsers,
    sendTypingIndicator
  };
};

export default useChatWindow;
