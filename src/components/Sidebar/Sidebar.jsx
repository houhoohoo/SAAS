import React from 'react';
import Button from '../common/Button';
import Icon from '../common/Icon';
import styles from './Sidebar.module.css';

const Sidebar = ({
    conversations,
    activeConversation,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
    onShowFileUpload
}) => {
    return (
        <div className={styles.sidebar}>
            <div className={styles.header}>
                <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={onNewConversation}
                >
                    <Icon name="plus" size={16} /> 新建对话
                </Button>
            </div>

            <div className={styles.conversationList}>
                {conversations.map(conv => (
                    <div
                        key={conv.id}
                        className={`${styles.conversationItem} ${activeConversation === conv.id ? styles.active : ''}`}
                        onClick={() => onSelectConversation(conv.id)}
                    >
                        <div className={styles.convTitle}>{conv.title}</div>
                        <button
                            className={styles.deleteButton}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conv.id);
                            }}
                        >
                            <Icon name="close" size={14} />
                        </button>
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <Button
                    variant="secondary"
                    fullWidth
                    onClick={onShowFileUpload}
                >
                    <Icon name="upload" size={16} /> 上传文件
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;