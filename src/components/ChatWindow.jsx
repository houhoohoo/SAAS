import React, { useState, useRef, useEffect } from 'react';
import Message from './Message';

const ChatWindow = ({ conversation, onSendMessage, isGenerating, onInterrupt }) => {
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
    }, [conversation.messages]);

    return (
        <div className="chat-window">
            <div className="chat-header">
                <h2>{conversation.title}</h2>
            </div>

            <div className="messages-container">
                {conversation.messages.length === 0 ? (
                    <div className="empty-state">
                        <div className="ai-avatar">
                            <div className="ai-icon">AI</div>
                        </div>
                        <h3>你好！我是DeepSeek助手</h3>
                        <p>你可以问我任何问题，我会尽力为你解答</p>
                        <div className="suggestions">
                            <button>如何学习React?</button>
                            <button>JavaScript闭包是什么?</button>
                            <button>解释一下事件循环</button>
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

            <div className="input-area">
                {isGenerating && (
                    <div className="generating-indicator">
                        <div className="loader"></div>
                        <button className="interrupt-btn" onClick={onInterrupt}>
                            停止生成
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="input-container">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="输入消息..."
                            disabled={isGenerating}
                        />
                        <button
                            type="submit"
                            disabled={!inputValue.trim() || isGenerating}
                            className="send-btn"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </form>

                <div className="input-hints">
                    <span>Shift + Enter 换行</span>
                    <span>Enter 发送</span>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;