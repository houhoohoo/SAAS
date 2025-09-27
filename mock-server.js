/* eslint-disable no-case-declarations */
// mock-server.js - 修复版本
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
console.log("Mock WebSocket server running on ws://localhost:8080");

// 内存存储对话和消息
let conversations = [
    {
        id: "1",
        title: "测试对话",
        createdAt: new Date().toISOString(),
        messages: []
    }
];
const uploadedFilesCache = new Map();
// 消息类型常量（与前端保持一致）
const MESSAGE_TYPES = {
    // 请求-响应类型（需要加 _response 后缀）
    GET_CONVERSATIONS: 'get_conversations',
    CREATE_CONVERSATION: 'create_conversation',
    DELETE_CONVERSATION: 'delete_conversation',
    SEND_MESSAGE: 'send_message',
    UPLOAD_FILES: 'upload_files',
    INTERRUPT_CONVERSATION: 'interrupt_conversation',
    REGENERATE_MESSAGE: 'regenerate_message',
    EDIT_MESSAGE: 'edit_message',

    // 服务端推送事件
    CONVERSATION_CREATED: 'conversation_created',
    CONVERSATION_DELETED: 'conversation_deleted',
    MESSAGE_SENT: 'message_sent',
    MESSAGE_UPDATED: 'message_updated',
    ERROR_OCCURRED: 'error_occurred'
};
const HEARTBEAT_INTERVAL = 30 * 1000;
let interval;
wss.on("connection", (ws) => {
    console.log("前端已连接 ✅");
    interval = setInterval(() => {
        if (ws.readyState === ws.OPEN) {
            ws.ping();
            console.log("发送心跳 (ping) 🚀");
        } else {
            clearInterval(interval);
        }
    }, HEARTBEAT_INTERVAL);
    ws.on("message", (msg) => {
        try {
            const data = JSON.parse(msg);
            console.log("收到前端消息:", data);

            const { type, payload, requestId } = data;

            // --- 请求响应模板 ---
            const sendResponse = (responseType, responsePayload) => {
                const response = {
                    type: responseType,
                    payload: responsePayload,
                    requestId
                };
                console.log("发送响应:", response);
                ws.send(JSON.stringify(response));
            };

            // --- 处理各种消息类型 ---
            switch (type) {
                case MESSAGE_TYPES.GET_CONVERSATIONS:
                    sendResponse(`${MESSAGE_TYPES.GET_CONVERSATIONS}_response`, conversations);
                    break;

                case MESSAGE_TYPES.CREATE_CONVERSATION:
                    const newConv = {
                        id: `conv-${Date.now()}`,
                        title: "新对话",
                        createdAt: new Date().toISOString(),
                        messages: []
                    };
                    conversations.unshift(newConv);
                    sendResponse(`${MESSAGE_TYPES.CREATE_CONVERSATION}_response`, newConv);

                    // 推送事件通知前端
                    ws.send(JSON.stringify({
                        type: MESSAGE_TYPES.CONVERSATION_CREATED,
                        payload: newConv
                    }));
                    break;

                case MESSAGE_TYPES.DELETE_CONVERSATION:
                    conversations = conversations.filter(c => c.id !== payload.conversationId);
                    sendResponse(`${MESSAGE_TYPES.DELETE_CONVERSATION}_response`, { success: true });

                    ws.send(JSON.stringify({
                        type: MESSAGE_TYPES.CONVERSATION_DELETED,
                        payload: { conversationId: payload.conversationId }
                    }));
                    break;

                case MESSAGE_TYPES.SEND_MESSAGE:
                    const conv = conversations.find(c => c.id === payload.conversationId);
                    // 验证文件是否已上传
                    const validFiles = [];
                    if (payload.files && Array.isArray(payload.files)) {
                        payload.files.forEach(file => {
                            if (file.id && uploadedFilesCache.has(file.id)) {
                                validFiles.push(uploadedFilesCache.get(file.id));
                            }
                        });
                    }
                    // 生成用户消息ID（使用与前端一致的格式）
                    const userMsgId = `msg-${Date.now()}-user`;
                    const userMsg = {
                        id: userMsgId,
                        text: payload.message,
                        sender: "user",
                        timestamp: new Date().toISOString(),
                        files: validFiles
                    };

                    // 先保存用户消息
                    conv.messages.push(userMsg);

                    // 更新对话标题（如果是新对话的第一个消息）
                    if (conv.messages.length === 1 && payload.message) {
                        conv.title = payload.message.substring(0, 20) + (payload.message.length > 20 ? '...' : '');
                    }

                    // 立即返回用户消息确认
                    sendResponse(`${MESSAGE_TYPES.SEND_MESSAGE}_response`, {
                        success: true,
                        userMessage: userMsg, // 返回用户消息确认
                        conversationId: payload.conversationId
                    });

                    // 模拟 AI 思考和处理
                    setTimeout(() => {
                        // 生成AI消息
                        const aiMsg = {
                            id: `msg-${Date.now()}-ai`,
                            text: generateAIResponse(payload.message, validFiles), // 模拟AI回复
                            sender: "ai",
                            timestamp: new Date().toISOString(),
                            inResponseTo: userMsgId // 关联到用户消息
                        };

                        // 保存AI消息
                        conv.messages.push(aiMsg);

                        if (payload.files && Array.isArray(payload.files)) {
                            payload.files.forEach(file => {
                                if (file.id) {
                                    uploadedFilesCache.delete(file.id);
                                }
                            });
                        }
                        // 推送AI回复事件
                        ws.send(JSON.stringify({
                            type: MESSAGE_TYPES.MESSAGE_SENT,
                            payload: {
                                conversationId: payload.conversationId,
                                messages: [userMsg, aiMsg], // 只推送AI消息，用户消息已确认
                            }
                        }));

                    }, 1000);
                    break;

                    // 添加一个简单的AI回复生成函数
                    function generateAIResponse(userMessage, files = []) {
                        let response = `感谢您的消息："${userMessage}"。`;

                        if (files && files.length > 0) {
                            response += ` 我注意到您上传了 ${files.length} 个文件：${files.map(f => f.name).join(', ')}。`;
                        }

                        response += " 这是基于您的问题生成的模拟回复。在实际应用中，这里会是真实的AI模型响应。";

                        return response;
                    }

                case MESSAGE_TYPES.UPLOAD_FILES:
                    try {
                        console.log('收到文件上传请求:', payload.files);

                        // 验证文件数据
                        if (!payload.files || !Array.isArray(payload.files)) {
                            sendResponse(`${MESSAGE_TYPES.UPLOAD_FILES}_response`, {
                                success: false,
                                error: "无效的文件数据"
                            });
                            break;
                        }

                        // 模拟文件上传验证
                        const maxSize = 10 * 1024 * 1024; // 10MB限制
                        const allowedTypes = [
                            'application/pdf',
                            'text/plain',
                            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                            'image/jpeg',
                            'image/png'
                        ];

                        const invalidFiles = payload.files.filter(file => {
                            // 检查文件对象是否有效
                            if (!file || typeof file !== 'object') {
                                return true;
                            }

                            // 检查必要属性
                            if (!file.name || file.size === undefined || !file.type) {
                                return true;
                            }

                            return file.size > maxSize || !allowedTypes.includes(file.type);
                        });

                        if (invalidFiles.length > 0) {
                            sendResponse(`${MESSAGE_TYPES.UPLOAD_FILES}_response`, {
                                success: false,
                                error: `以下文件超过大小限制或格式不符: ${invalidFiles.map(f => f.name).join(', ')}`
                            });
                            break;
                        }

                        // 模拟文件上传处理（在实际应用中这里会有真正的文件存储逻辑）
                        const uploadedFiles = payload.files.map((file, idx) => {
                            // 生成文件ID和URL
                            const fileId = `file-${Date.now()}-${idx}`;

                            // 对于模拟服务器，我们可以创建对象URL（如果文件数据可用）
                            let fileUrl = '';
                            try {
                                fileUrl = 'https://www.nature.com/articles/s41433-022-02122-2.pdf';
                            } catch (error) {
                                console.warn('创建文件URL失败:', error);
                                fileUrl = `mock://fallback/${fileId}`;
                            }
                            const processedFile = {
                                id: fileId,
                                name: file.name,
                                size: file.size,
                                type: file.type,
                                url: fileUrl,
                                uploadedAt: new Date().toISOString(),
                                status: "success",
                                originalName: file.name,
                                lastModified: file.lastModified || Date.now()
                            };

                            // ✅ 存储到全局缓存
                            uploadedFilesCache.set(fileId, processedFile);

                            return processedFile;
                        });

                        console.log('文件上传成功:', uploadedFiles);

                        sendResponse(`${MESSAGE_TYPES.UPLOAD_FILES}_response`, {
                            success: true,
                            files: uploadedFiles
                        });

                    } catch (error) {
                        console.error('文件上传处理错误:', error);
                        sendResponse(`${MESSAGE_TYPES.UPLOAD_FILES}_response`, {
                            success: false,
                            error: "文件上传处理失败: " + error.message
                        });
                    }
                    break;

                case MESSAGE_TYPES.INTERRUPT_CONVERSATION:
                    sendResponse(`${MESSAGE_TYPES.INTERRUPT_CONVERSATION}_response`, {
                        success: true
                    });
                    break;

                case MESSAGE_TYPES.REGENERATE_MESSAGE:
                    try {
                        console.log('收到重新生成消息请求:', payload);

                        const { messageId, conversationId } = payload;

                        // 查找对话
                        const convR = conversations.find(c => c.id === conversationId);

                        // 查找要重新生成的消息（应该是AI消息）
                        const originalMsg = convR.messages.find(m => m.id === messageId);


                        // 查找对应的用户消息（用于生成新的回复）
                        const userMsg = convR.messages.find(m =>
                            m.sender === 'user' &&
                            convR.messages.indexOf(m) < convR.messages.indexOf(originalMsg)
                        );

                        // 立即返回成功响应
                        sendResponse(`${MESSAGE_TYPES.REGENERATE_MESSAGE}_response`, {
                            success: true,
                            messageId: messageId,
                            conversationId: conversationId
                        });

                        // 模拟AI重新生成过程
                        setTimeout(() => {
                            // 生成新的AI消息
                            const newAiMsg = {
                                id: `msg-${Date.now()}-ai-regenerated`,
                                text: generateRegeneratedResponse(userMsg ? userMsg.text : originalMsg.text),
                                sender: "ai",
                                timestamp: new Date().toISOString(),
                                isRegenerated: true,
                                originalMessageId: messageId
                            };

                            // 找到原消息的位置并替换
                            const msgIndex = convR.messages.findIndex(m => m.id === messageId);
                            if (msgIndex !== -1) {
                                convR.messages[msgIndex] = newAiMsg;
                            }

                            // 推送消息更新事件
                            ws.send(JSON.stringify({
                                type: MESSAGE_TYPES.MESSAGE_UPDATED,
                                payload: {
                                    conversationId: conversationId,
                                    messageId: messageId,
                                    newMessage: newAiMsg
                                }
                            }));

                        }, 800);

                        // 重新生成回复的生成函数
                        function generateRegeneratedResponse(originalText) {
                            return `【重新生成】基于您的问题"${originalText.substring(0, 30)}..."，这是重新生成的回复。我会用不同的方式来解答您的问题，提供更全面的分析。`;
                        }

                    } catch (error) {
                        console.error('重新生成消息处理错误:', error);
                        sendResponse(`${MESSAGE_TYPES.REGENERATE_MESSAGE}_response`, {
                            success: false,
                            error: "重新生成消息失败: " + error.message
                        });
                    }
                    break;

                case MESSAGE_TYPES.EDIT_MESSAGE:
                    try {
                        console.log('收到编辑消息请求:', payload);

                        const { messageId, newContent, conversationId } = payload;

                        // 查找对话
                        const convE = conversations.find(c => c.id === conversationId);

                        // 查找要编辑的消息（应该是用户消息）的索引
                        const msgIndex = convE.messages.findIndex(m => m.id === messageId);

                        const newUserMsg = {
                            id: messageId, // 保持ID不变以便前端识别替换
                            text: newContent,
                            sender: "user",
                            timestamp: new Date().toISOString(),
                        };

                        convE.messages[msgIndex] = newUserMsg;
                        convE.messages = convE.messages.slice(0, msgIndex + 1); // 只保留到编辑后的用户消息

                        sendResponse(`${MESSAGE_TYPES.EDIT_MESSAGE}_response`, {
                            success: true,
                            messageId: messageId,
                            conversationId: conversationId,
                            editedMessage: newUserMsg // 返回新的用户消息，表示已替换
                        });

                        setTimeout(() => {
                            // 生成新的AI回复
                            const newAiResponse = {
                                id: `msg-${Date.now()}-ai-response`,
                                text: generateEditResponse(newContent),
                                sender: "ai",
                                timestamp: new Date().toISOString(),
                                // inResponseTo: messageId // 可以保留关联
                            };

                            convE.messages.push(newAiResponse);

                            ws.send(JSON.stringify({
                                type: MESSAGE_TYPES.MESSAGE_SENT,
                                payload: {
                                    conversationId: conversationId,
                                    messages: [newAiResponse]
                                }
                            }));

                            ws.send(JSON.stringify({
                                type: MESSAGE_TYPES.MESSAGE_UPDATED,
                                payload: {
                                    conversationId: conversationId,
                                    messageId: messageId,
                                    newMessage: newUserMsg
                                }
                            }));

                        }, 1000);

                        function generateEditResponse(editedContent) {
                            return `【更新回复】针对您编辑后的消息"${editedContent.substring(0, 40)}..."，我重新进行了分析。这是基于新内容生成的回复，希望能更好地解答您的问题。`;
                        }

                    } catch (error) {
                        console.error('编辑消息处理错误:', error);
                        sendResponse(`${MESSAGE_TYPES.EDIT_MESSAGE}_response`, {
                            success: false,
                            error: "编辑消息失败: " + error.message
                        });
                    }
                    break;
                default:
                    sendResponse(`${MESSAGE_TYPES.ERROR_OCCURRED}`, {
                        message: "未知的消息类型: " + type
                    });
                    break;
            }
        } catch (error) {
            console.error("处理消息时出错:", error);
            ws.send(JSON.stringify({
                type: MESSAGE_TYPES.ERROR_OCCURRED,
                payload: { message: "服务器内部错误" }
            }));
        }
    });

    ws.on("close", () => {
        console.log("WebSocket连接关闭");
        clearInterval(interval);
    });

    ws.on("error", (err) => {
        console.error("WebSocket错误:", err);
        clearInterval(interval);
    });
});