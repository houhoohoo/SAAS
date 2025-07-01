import React from 'react';

const Message = ({ message }) => {
    const isAI = message.sender === 'ai';

    return (
        <div className={`message ${isAI ? 'ai-message' : 'user-message'}`}>
            <div className="message-avatar">
                {isAI ? (
                    <div className="ai-avatar">
                        <div className="ai-icon">AI</div>
                    </div>
                ) : (
                    <div className="user-avatar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" />
                            <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                )}
            </div>

            <div className="message-content">
                <div className="message-text">{message.text}</div>
                <div className="message-timestamp">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
};

export default Message;