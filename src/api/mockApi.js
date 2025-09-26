// 模拟后端API
const conversations = [
    {
        id: '1',
        title: '如何学习React?',
        createdAt: '2023-10-01T10:30:00',
        messages: [
            { id: '1-1', text: '你好，我想学习React，有什么建议吗？', sender: 'user', timestamp: '2023-10-01T10:30:00' },
            { id: '1-2', text: '学习React可以从官方文档开始，它提供了详细的教程和API参考。建议先学习JSX语法、组件生命周期和状态管理。', sender: 'ai', timestamp: '2023-10-01T10:32:00' }
        ]
    },
    {
        id: '2',
        title: 'JavaScript闭包问题',
        createdAt: '2023-10-02T14:15:00',
        messages: [
            { id: '2-1', text: '能解释一下JavaScript中的闭包吗？', sender: 'user', timestamp: '2023-10-02T14:15:00' },
            { id: '2-2', text: '闭包是指有权访问另一个函数作用域中变量的函数。创建闭包的常见方式是在一个函数内部创建另一个函数。', sender: 'ai', timestamp: '2023-10-02T14:17:00' }
        ]
    }
];

// 模拟API延迟
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 获取对话列表
export const getConversations = async () => {
    await delay(500);
    return [...conversations];
};

// 创建新对话
export const createConversation = async () => {
    await delay(300);
    const newId = `conv-${Date.now()}`;
    const newConversation = {
        id: newId,
        title: '新对话',
        createdAt: new Date().toISOString(),
        messages: []
    };
    conversations.unshift(newConversation);
    return newConversation;
};

// 删除对话
export const deleteConversation = async (id) => {
    await delay(300);
    const index = conversations.findIndex(c => c.id === id);
    if (index !== -1) {
        conversations.splice(index, 1);
    }
    return { success: true };
};

// 发送消息
export const sendMessage = async (conversationId, message, files = []) => {
    await delay(1000);
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return null;

    const newUserMessage = {
        id: `msg-${Date.now()}-user`,
        text: message,
        sender: 'user',
        timestamp: new Date().toISOString(),
        files: files.length > 0 ? files : undefined
    };

    conversation.messages.push(newUserMessage);
    // 模拟AI响应（包含文件处理提示）
    let aiResponseText = `感谢您的消息："${message}"。`;
    if (files.length > 0) {
        aiResponseText += ` 我注意到您上传了 ${files.length} 个文件：${files.map(f => f.name).join(', ')}。我会结合文件内容进行分析。`;
    }
    aiResponseText += `这是一个模拟的AI回复，实际应用中这里会是真实的AI模型生成的响应。`;
    // 模拟AI响应
    const aiResponse = {
        id: `msg-${Date.now()}-ai`,
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date().toISOString()
    };

    conversation.messages.push(aiResponse);
    console.log('api发送消息', newUserMessage);
    return {
        conversationId,
        messages: [newUserMessage, aiResponse]
    };
};

// 上传文件
export const uploadFiles = async (files) => {
    await delay(1500);

    // 模拟验证逻辑
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
        'application/pdf',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
    ];

    const invalidFiles = files.filter(file =>
        file.size > maxSize || !allowedTypes.includes(file.type)
    );  

    if (invalidFiles.length > 0) {
        throw new Error(`以下文件超过${maxSize / 1024 / 1024}MB或类型不支持: ${invalidFiles.map(f => f.name).join(', ')}`);
    }

    // 模拟成功响应
    return {
        success: true,
        message: `成功上传 ${files.length} 个文件`,
        files: files.map((file, index) => ({
            id: `file-${Date.now()}-${index}`,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            status: 'success',
            url: file.type==='application/pdf' ? 'https://www.excli.de/vol14/Wascher_27112015_proof.pdf' : 'file:///F:/%E4%B8%8B%E8%BD%BD/Documents/EmojiChat.pdf' // 仅PDF生成预览URL
        }))
    };
};

// 中断对话
export const interruptConversation = async () => {
    await delay(100);
    return { success: true };
};

// 新增：重新生成消息
export const regenerateMessage = async (messageId, conversationId) => {
    await delay(800);

    // 查找原消息
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) {
        throw new Error('对话不存在');
    }

    const originalMessage = conversation.messages.find(msg => msg.id === messageId);
    if (!originalMessage) {
        throw new Error('消息不存在');
    }

    // 生成新的AI回复
    const newAiMessage = {
        id: `msg-${Date.now()}-ai-regenerated`,
        text: `【重新生成】这是对消息"${originalMessage.text.substring(0, 20)}..."的新回复。我重新思考了这个问题，提供了更详细的解答。`,
        sender: 'ai',
        timestamp: new Date().toISOString()
    };

    // 在对话中替换原AI消息
    const messageIndex = conversation.messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
        conversation.messages[messageIndex] = newAiMessage;
    }

    return {
        success: true,
        newMessage: newAiMessage,
        conversationId
    };
};

// 编辑消息
export const editMessage = async (messageId, newContent, conversationId) => {
    await delay(300);

    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) {
        throw new Error('对话不存在');
    }

    const originalMessage = conversation.messages.find(msg => msg.id === messageId);
    if (!originalMessage) {
        throw new Error('消息不存在');
    }

    if (originalMessage.sender !== 'user') {
        throw new Error('只能编辑用户消息');
    }

    // 更新消息内容 - 保留原文件和其他属性
    const editedMessage = {
        ...originalMessage,
        text: newContent,
        editedAt: new Date().toISOString(),
        isEdited: true
    };

    // 生成新的AI回复
    const newAiMessage = {
        id: `msg-${Date.now()}-ai-response`,
        text: `【更新回复】针对您编辑后的消息"${newContent.substring(0, 30)}..."，这是我的新回复。`,
        sender: 'ai',
        timestamp: new Date().toISOString(),
        isResponseToEdit: true
    };

    // 更新对话消息
    const userMessageIndex = conversation.messages.findIndex(msg => msg.id === messageId);

    // 保留编辑消息之前的所有消息
    const messagesBeforeEdit = conversation.messages.slice(0, userMessageIndex);

    // 添加编辑后的消息和新AI回复
    const messagesAfterEdit = conversation.messages.slice(userMessageIndex + 1)
        .filter(msg => msg.sender === 'user' ||
            (msg.sender === 'ai' && messagesBeforeEdit.some(m => m.id === msg.id)));

    conversation.messages = [
        ...messagesBeforeEdit,
        editedMessage,
        newAiMessage,
        ...messagesAfterEdit
    ];

    return {
        success: true,
        editedMessage: editedMessage,
        newResponse: newAiMessage,
        conversationId
    };
};