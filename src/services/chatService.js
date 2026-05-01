import api from './api';

/**
 * Servicio para gestionar conversaciones y mensajes del chat
 */
const chatService = {
  /**
   * Obtener contactos disponibles para chat según rol del usuario
   * @param {string} searchTerm - Término de búsqueda opcional
   * @returns {Promise} Contactos agrupados por rol
   */
  getContacts: async (searchTerm = '') => {
    try {
      const params = searchTerm ? { searchTerm } : {};
      const response = await api.get('/chat/contacts', { params });
      return response.data;
    } catch (error) {
      console.error('Error al obtener contactos:', error);
      throw error;
    }
  },

  /**
   * Obtener todas las conversaciones del usuario actual
   * @param {string} userId - ID del usuario
   * @returns {Promise} Conversaciones del usuario
   */
  getConversations: async (userId) => {
    try {
      const response = await api.get(`/chat/conversations?user_id=${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener conversaciones:', error);
      throw error;
    }
  },

  /**
   * Crear una nueva conversación
   * @param {Object} conversationData - Datos de la conversación
   * @param {Array} conversationData.participants - IDs de los participantes
   * @param {string} conversationData.title - Título opcional
   * @param {string} conversationData.type - Tipo (direct, group)
   * @returns {Promise} Conversación creada
   */
  createConversation: async (conversationData) => {
    try {
      // El backend espera 'participantIds' en lugar de 'participants'
      const payload = {
        participantIds: conversationData.participants || conversationData.participantIds,
        type: conversationData.type,
        ...(conversationData.title && { title: conversationData.title })
      };
      console.log('📤 Creando conversación con payload:', JSON.stringify(payload, null, 2));
      const response = await api.post('/chat/conversations', payload);
      console.log('✅ Conversación creada:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error al crear conversación:', error);
      console.error('❌ Detalles del error:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Obtener detalles de una conversación
   * @param {string} conversationId - ID de la conversación
   * @returns {Promise} Detalles de la conversación
   */
  getConversationDetails: async (conversationId) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener detalles de conversación:', error);
      throw error;
    }
  },

  /**
   * Obtener mensajes de una conversación
   * @param {string} conversationId - ID de la conversación
   * @param {number} page - Página (para paginación)
   * @param {number} limit - Límite de mensajes
   * @returns {Promise} Mensajes de la conversación
   */
  getMessages: async (conversationId, page = 1, limit = 50) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener mensajes:', error);
      throw error;
    }
  },

  /**
   * Enviar un mensaje de texto en una conversación
   * @param {string} conversationId - ID de la conversación
   * @param {Object} messageData - Datos del mensaje
   * @param {string} messageData.sender_id - ID del remitente
   * @param {string} messageData.content - Contenido del mensaje (texto plano)
   * @returns {Promise} Mensaje enviado
   */
  sendMessage: async (conversationId, messageData) => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/messages`, messageData);
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  },

  /**
   * Marcar mensajes como leídos
   * @param {string} conversationId - ID de la conversación
   * @param {string} userId - ID del usuario
   * @param {string} messageId - ID del mensaje (opcional)
   * @returns {Promise} Confirmación
   */
  markAsRead: async (conversationId, userId, messageId = null) => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/read`, {
        user_id: userId,
        message_id: messageId
      });
      return response.data;
    } catch (error) {
      console.error('Error al marcar como leído:', error);
      throw error;
    }
  },

  /**
   * Editar un mensaje
   * @param {string} messageId - ID del mensaje
   * @param {string} content - Nuevo contenido
   * @param {string} editedBy - ID del usuario que edita
   * @returns {Promise} Mensaje editado
   */
  editMessage: async (messageId, content, editedBy) => {
    try {
      const response = await api.put(`/chat/messages/${messageId}`, {
        content,
        edited_by: editedBy
      });
      return response.data;
    } catch (error) {
      console.error('Error al editar mensaje:', error);
      throw error;
    }
  },

  /**
   * Eliminar un mensaje
   * @param {string} messageId - ID del mensaje
   * @param {string} deletedBy - ID del usuario que elimina
   * @returns {Promise} Confirmación
   */
  deleteMessage: async (messageId, deletedBy) => {
    try {
      const response = await api.delete(`/chat/messages/${messageId}`, {
        data: { deleted_by: deletedBy }
      });
      return response.data;
    } catch (error) {
      console.error('Error al eliminar mensaje:', error);
      throw error;
    }
  },

  /**
   * Agregar participante a una conversación
   * @param {string} conversationId - ID de la conversación
   * @param {string} userId - ID del usuario a agregar
   * @param {string} addedBy - ID del usuario que agrega
   * @returns {Promise} Confirmación
   */
  addParticipant: async (conversationId, userId, addedBy) => {
    try {
      const response = await api.post(`/chat/conversations/${conversationId}/participants`, {
        user_id: userId,
        added_by: addedBy
      });
      return response.data;
    } catch (error) {
      console.error('Error al agregar participante:', error);
      throw error;
    }
  },

  /**
   * Remover participante de una conversación
   * @param {string} conversationId - ID de la conversación
   * @param {string} userId - ID del usuario a remover
   * @param {string} removedBy - ID del usuario que remueve
   * @returns {Promise} Confirmación
   */
  removeParticipant: async (conversationId, userId, removedBy) => {
    try {
      const response = await api.delete(`/chat/conversations/${conversationId}/participants/${userId}`, {
        data: { removed_by: removedBy }
      });
      return response.data;
    } catch (error) {
      console.error('Error al remover participante:', error);
      throw error;
    }
  }
};

export default chatService;
