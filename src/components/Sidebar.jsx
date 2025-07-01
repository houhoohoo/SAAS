import { useState } from 'react';
import FileUpload from './FileUpload';

const Sidebar = ({
    conversations,
    activeConversation,
    onSelectConversation,
    onNewConversation,
    onDeleteConversation,
    onUploadFiles
}) => {
    const [showFileUpload, setShowFileUpload] = useState(false);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <button className="new-chat-btn" onClick={onNewConversation}>
                    <span>+</span> 新建对话
                </button>
            </div>

            <div className="conversation-list">
                {conversations.map(conv => (
                    <div
                        key={conv.id}
                        className={`conversation-item ${activeConversation === conv.id ? 'active' : ''}`}
                        onClick={() => onSelectConversation(conv.id)}
                    >
                        <div className="conv-title">{conv.title}</div>
                        <button
                            className="delete-conv-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conv.id);
                            }}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <button
                    className="upload-btn"
                    onClick={() => setShowFileUpload(true)}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V10H16L12 5L8 10H11V16Z" fill="currentColor" />
                        <path d="M5 20H19C19.5523 20 20 19.5523 20 19V14H18V18H6V14H4V19C4 19.5523 4.44772 20 5 20Z" fill="currentColor" />
                    </svg>
                    上传文件
                </button>
            </div>

            {showFileUpload && (
                <FileUpload
                    onClose={() => setShowFileUpload(false)}
                    onUpload={onUploadFiles}
                />
            )}
        </div>
    );
};

export default Sidebar;