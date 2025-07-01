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
export const sendMessage = async (conversationId, message) => {
    await delay(1000);
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return null;

    const newUserMessage = {
        id: `msg-${Date.now()}-user`,
        text: message,
        sender: 'user',
        timestamp: new Date().toISOString()
    };

    conversation.messages.push(newUserMessage);

    // 模拟AI响应
    const aiResponse = {
        id: `msg-${Date.now()}-ai`,
        text: `感谢您的消息："${message}"。这是一个模拟的AI回复，实际应用中这里会是真实的AI模型生成的响应。`,
        sender: 'ai',
        timestamp: new Date().toISOString()
    };

    conversation.messages.push(aiResponse);

    return {
        conversationId,
        messages: [newUserMessage, aiResponse]
    };
};

// 上传文件
export const uploadFiles = async (files) => {
    await delay(1500);
    return {
        success: true,
        files: files.map(file => ({
            id: `file-${Date.now()}-${file.name}`,
            name: file.name,
            size: file.size,
            type: file.type,
            url: URL.createObjectURL(file)
        }))
    };
};

// 中断对话
export const interruptConversation = async () => {
    await delay(100);
    return { success: true };
};