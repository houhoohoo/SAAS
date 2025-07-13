import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import Button from '../common/Button';
import Loader from '../common/Loader';
import Icon from '../common/Icon';
import styles from './ChatWindow.module.css';

const EmptyState = ({
    title = '你好！我是DeepSeek助手',
    description = '你可以问我任何问题，我会尽力为你解答',
    onStartChat,
    suggestions = []
}) => {
    return (
        <div className={styles.emptyState}>
            <div className={styles.aiAvatar}>
                <Icon name="RobotOutlined" size={48} />
            </div>
            <h3>{title}</h3>
            <p>{description}</p>

            <div className={styles.suggestions}>
                {suggestions.map((suggestion, index) => (
                    <Button
                        key={index}
                        variant="outline"
                        onClick={() => onStartChat?.(suggestion)}
                    >
                        {suggestion}
                    </Button>
                ))}
            </div>
        </div>
    );
};

const ChatWindow = ({
    conversation,
    isGenerating,
    onSendMessage,
    onInterrupt,
    onCreateNewConversation
}) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);
    const [isFirstMessage, setIsFirstMessage] = useState(true);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isGenerating) return;

        // 如果是第一条消息，创建新对话
        if (isFirstMessage) {
            onCreateNewConversation?.();
            setIsFirstMessage(false);
        }

        onSendMessage(inputValue);
        setInputValue('');
    };

    const handleStartChat = (message) => {
        // 创建新对话并发送第一条消息
        onCreateNewConversation?.();
        onSendMessage(message);
        setIsFirstMessage(false);
    };

    // 滚动到底部
    useEffect(() => {
        if (conversation?.messages?.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [conversation?.messages]);

    const defaultSuggestions = [
        '如何学习React?',
        'JavaScript闭包是什么?',
        '解释一下事件循环'
    ];

    // 计算是否显示居中布局（没有对话或没有消息）
    const showCenteredLayout = !conversation || conversation.messages.length === 0;

    return (
        <div className={`${styles.chatWindow} ${showCenteredLayout ? styles.centeredLayout : ''}`}>
            {conversation && (
                <div className={styles.header}>
                    <h2>{conversation.title || '新对话'}</h2>
                </div>
            )}

            <div className={styles.messagesContainer}>
                {showCenteredLayout ? (
                    <EmptyState
                        title={conversation ? '你好！我是DeepSeek助手' : '欢迎使用DeepSeek助手'}
                        description={conversation ? '你可以问我任何问题，我会尽力为你解答' : '开始与AI助手对话'}
                        onStartChat={handleStartChat}
                        suggestions={conversation ? defaultSuggestions : []}
                    />
                ) : (
                    conversation.messages.map(msg => (
                        <Message
                            key={msg.id}
                            message={msg}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className={`${styles.inputArea} ${showCenteredLayout ? styles.centeredInput : ''}`}>
                {isGenerating && (
                    <div className={styles.generatingIndicator}>
                        <Loader size="small" />
                        <Button
                            variant="danger-outline"
                            size="small"
                            onClick={onInterrupt}
                        >
                            停止生成
                        </Button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className={styles.inputContainer}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="输入消息..."
                            disabled={isGenerating}
                        />
                        <Button
                            type="submit"
                            variant="icon"
                            disabled={!inputValue.trim() || isGenerating}
                        >
                            <Icon name="SendOutlined" size={20} />
                        </Button>
                    </div>
                </form>

                <div className={styles.inputHints}>
                    <span>Shift + Enter 换行</span>
                    <span>Enter 发送</span>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;