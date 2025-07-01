import { useState, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import './App.css';

function App() {
  const [conversations, setConversations] = useState([
    {
      id: '1', title: '如何学习React?', messages: [
        { id: '1-1', text: '你好，我想学习React，有什么建议吗？', sender: 'user', timestamp: new Date('2023-10-01T10:30:00') },
        { id: '1-2', text: '学习React可以从官方文档开始，它提供了详细的教程和API参考。建议先学习JSX语法、组件生命周期和状态管理。', sender: 'ai', timestamp: new Date('2023-10-01T10:32:00') }
      ]
    },
    {
      id: '2', title: 'JavaScript闭包问题', messages: [
        { id: '2-1', text: '能解释一下JavaScript中的闭包吗？', sender: 'user', timestamp: new Date('2023-10-02T14:15:00') },
        { id: '2-2', text: '闭包是指有权访问另一个函数作用域中变量的函数。创建闭包的常见方式是在一个函数内部创建另一个函数。', sender: 'ai', timestamp: new Date('2023-10-02T14:17:00') }
      ]
    }
  ]);

  const [activeConversation, setActiveConversation] = useState('1');
  const [isGenerating, setIsGenerating] = useState(false);
  const abortControllerRef = useRef(null);

  const createNewConversation = () => {
    const newId = `conv-${Date.now()}`;
    const newConversation = {
      id: newId,
      title: '新对话',
      messages: []
    };

    setConversations(prev => [newConversation, ...prev]);
    setActiveConversation(newId);
  };

  const deleteConversation = (id) => {
    if (conversations.length === 1) return;

    setConversations(prev => prev.filter(conv => conv.id !== id));
    if (activeConversation === id) {
      setActiveConversation(conversations[0].id);
    }
  };

  const handleSendMessage = async (message) => {
    const convIndex = conversations.findIndex(c => c.id === activeConversation);
    if (convIndex === -1) return;

    const updatedConversations = [...conversations];
    const newUserMessage = {
      id: `msg-${Date.now()}`,
      text: message,
      sender: 'user',
      timestamp: new Date()
    };

    updatedConversations[convIndex].messages.push(newUserMessage);
    setConversations(updatedConversations);

    // 模拟AI生成响应
    setIsGenerating(true);
    abortControllerRef.current = new AbortController();

    try {
      // 模拟API调用
      const aiResponse = await generateAIResponse(message, abortControllerRef.current.signal);

      const updatedConversationsAfterResponse = [...conversations];
      const newAiMessage = {
        id: `msg-${Date.now()}`,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      updatedConversationsAfterResponse[convIndex].messages.push(newAiMessage);
      setConversations(updatedConversationsAfterResponse);
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('请求被取消');
      } else {
        console.error('生成回复时出错:', err);
        const updatedConversationsAfterError = [...conversations];
        updatedConversationsAfterError[convIndex].messages.push({
          id: `msg-${Date.now()}`,
          text: '生成回复时出错，请重试',
          sender: 'ai',
          timestamp: new Date()
        });
        setConversations(updatedConversationsAfterError);
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const handleInterrupt = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
    }
  };

  const handleUploadFiles = (files) => {
    console.log('上传的文件:', files);
    // 这里可以添加文件上传逻辑
    alert(`已成功上传 ${files.length} 个文件`);
  };

  // 模拟AI生成响应
  const generateAIResponse = async (message, signal) => {
    return new Promise((resolve, reject) => {
      // 模拟网络延迟
      const timeout = setTimeout(() => {
        if (signal.aborted) {
          reject(new DOMException('请求被取消', 'AbortError'));
          return;
        }

        // 根据用户消息生成回复
        const responses = {
          '你好': '你好！有什么我可以帮助你的吗？',
          '你叫什么名字': '我是DeepSeek助手，随时为你提供帮助！',
          '谢谢': '不客气！如果还有其他问题，随时问我。',
          'default': `感谢你的消息："${message}"。这是一个模拟的AI回复，实际应用中这里会是真实的AI模型生成的响应。`
        };

        resolve(responses[message] || responses['default']);
      }, 3000);

      // 监听取消信号
      signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new DOMException('请求被取消', 'AbortError'));
      });
    });
  };

  const activeConv = conversations.find(c => c.id === activeConversation) || conversations[0];

  return (
    <div className="app">
      <Sidebar
        conversations={conversations}
        activeConversation={activeConversation}
        onSelectConversation={setActiveConversation}
        onNewConversation={createNewConversation}
        onDeleteConversation={deleteConversation}
        onUploadFiles={handleUploadFiles}
      />
      <ChatWindow
        conversation={activeConv}
        onSendMessage={handleSendMessage}
        isGenerating={isGenerating}
        onInterrupt={handleInterrupt}
      />
    </div>
  );
}

export default App;