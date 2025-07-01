import React from 'react';
import Icon from '../common/Icon';
import styles from './ChatWindow.module.css';

const Message = ({ message }) => {
    const isAI = message.sender === 'ai';
    const timestamp = new Date(message.timestamp);

    return (
        <div className={`${styles.message} ${isAI ? styles.aiMessage : styles.userMessage}`}>
            <div className={styles.avatar}>
                {isAI ? (
                    <div className={styles.aiAvatar}>
                        <Icon name="ai" size={24} />
                    </div>
                ) : (
                    <div className={styles.userAvatar}>
                        <Icon name="user" size={24} />
                    </div>
                )}
            </div>

            <div className={styles.content}>
                <div className={styles.text}>{message.text}</div>
                <div className={styles.timestamp}>
                    {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    );
};

export default Message;