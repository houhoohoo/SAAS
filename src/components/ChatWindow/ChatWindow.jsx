import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';
import Button from '../common/Button';
import Loader from '../common/Loader';
import Icon from '../common/Icon';
import styles from './ChatWindow.module.css';

const ChatWindow = ({
    conversation,
    isGenerating,
    onSendMessage,
    onInterrupt
}) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isGenerating) return;

        onSendMessage(inputValue);
        setInputValue('');
    };

    // 滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [conversation?.messages]);

    if (!conversation) {
        return (
            <div className={styles.chatWindow}>
                <div className={styles.emptyState}>
                    <div className={styles.aiAvatar}>
                        <Icon name="ai" size={48} />
                    </div>
                    <h3>欢迎使用DeepSeek助手</h3>
                    <p>请从侧边栏选择对话或创建新对话</p>
                    <Button onClick={() => onSendMessage && onSendMessage('你好')}>
                        开始对话
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.chatWindow}>
            <div className={styles.header}>
                <h2>{conversation.title}</h2>
            </div>

            <div className={styles.messagesContainer}>
                {conversation.messages.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.aiAvatar}>
                            <Icon name="ai" size={48} />
                        </div>
                        <h3>你好！我是DeepSeek助手</h3>
                        <p>你可以问我任何问题，我会尽力为你解答</p>
                        <div className={styles.suggestions}>
                            <Button variant="outline">如何学习React?</Button>
                            <Button variant="outline">JavaScript闭包是什么?</Button>
                            <Button variant="outline">解释一下事件循环</Button>
                        </div>
                    </div>
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

            <div className={styles.inputArea}>
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
                            <Icon name="send" size={20} />
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