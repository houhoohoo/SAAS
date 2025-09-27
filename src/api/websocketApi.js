// api/websocketApi.js
import { websocketService } from '../services/websocketService';

// WebSocket消息类型
export const MESSAGE_TYPES = {
    // 客户端发送
    GET_CONVERSATIONS: 'get_conversations',
    CREATE_CONVERSATION: 'create_conversation',
    DELETE_CONVERSATION: 'delete_conversation',
    SEND_MESSAGE: 'send_message',
    UPLOAD_FILES: 'upload_files',
    INTERRUPT_CONVERSATION: 'interrupt_conversation',
    REGENERATE_MESSAGE: 'regenerate_message',
    EDIT_MESSAGE: 'edit_message',

    // 服务端推送
    CONVERSATION_CREATED: 'conversation_created',
    CONVERSATION_DELETED: 'conversation_deleted',
    MESSAGE_SENT: 'message_sent',
    MESSAGE_UPDATED: 'message_updated',
    TYPING_STARTED: 'typing_started',
    TYPING_ENDED: 'typing_ended',
    ERROR_OCCURRED: 'error_occurred'
};

// 初始化WebSocket连接
export const initWebSocket = async (url = 'ws://localhost:8080') => {
    try {
        await websocketService.connect(url);
        return true;
    } catch (error) {
        console.error('WebSocket连接失败:', error);
        return false;
    }
};

// 获取对话列表
export const getConversations = async () => {
    return websocketService.send(MESSAGE_TYPES.GET_CONVERSATIONS, {});
};

// 创建新对话
export const createConversation = async () => {
    return websocketService.send(MESSAGE_TYPES.CREATE_CONVERSATION, {});
};

// 删除对话
export const deleteConversation = async (conversationId) => {
    return websocketService.send(MESSAGE_TYPES.DELETE_CONVERSATION, { conversationId });
};

// 发送消息
export const sendMessage = async (conversationId, message, files = []) => {
    return websocketService.send(MESSAGE_TYPES.SEND_MESSAGE, {
        conversationId,
        message,
        files
    });
};

// 上传文件
export const uploadFiles = async (files) => {
    // 对于大文件，可能需要分片上传
    return websocketService.send(MESSAGE_TYPES.UPLOAD_FILES, { files });
};

// 中断对话
export const interruptConversation = async () => {
    return websocketService.send(MESSAGE_TYPES.INTERRUPT_CONVERSATION, {});
};

// 重新生成消息
export const regenerateMessage = async (messageId, conversationId) => {
    return websocketService.send(MESSAGE_TYPES.REGENERATE_MESSAGE, {
        messageId,
        conversationId
    });
};

// 编辑消息
export const editMessage = async (messageId, newContent, conversationId) => {
    return websocketService.send(MESSAGE_TYPES.EDIT_MESSAGE, {
        messageId,
        newContent,
        conversationId
    });
};

// 订阅服务端推送事件
export const subscribeToEvents = (handlers) => {
    const unsubscribers = [];

    if (handlers.onConversationCreated) {
        unsubscribers.push(
            websocketService.on(MESSAGE_TYPES.CONVERSATION_CREATED, handlers.onConversationCreated)
        );
    }

    if (handlers.onConversationDeleted) {
        unsubscribers.push(
            websocketService.on(MESSAGE_TYPES.CONVERSATION_DELETED, handlers.onConversationDeleted)
        );
    }

    if (handlers.onMessageSent) {
        unsubscribers.push(
            websocketService.on(MESSAGE_TYPES.MESSAGE_SENT, handlers.onMessageSent)
        );
    }

    if (handlers.onMessageUpdated) {
        unsubscribers.push(
            websocketService.on(MESSAGE_TYPES.MESSAGE_UPDATED, handlers.onMessageUpdated)
        );
    }

    if (handlers.onError) {
        unsubscribers.push(
            websocketService.on(MESSAGE_TYPES.ERROR_OCCURRED, handlers.onError)
        );
    }

    // 返回取消订阅的函数
    return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
    };
};

// 断开连接
export const disconnectWebSocket = () => {
    websocketService.disconnect();
};