import React, { useState } from 'react';
import Sidebar from './Sidebar';
import FileUpload from '../FileUpload';
import { useChat } from '../../contexts/ChatContext';

const SidebarContainer = () => {
    const [showFileUpload, setShowFileUpload] = useState(false);
    const {
        conversations,
        activeConversation,
        setActiveConversation,
        createNewConversation,
        deleteConversation
    } = useChat();

    return (
        <>
            <Sidebar
                conversations={conversations}
                activeConversation={activeConversation}
                onSelectConversation={setActiveConversation}
                onNewConversation={createNewConversation}
                onDeleteConversation={deleteConversation}
                onShowFileUpload={() => setShowFileUpload(true)}
            />
            {showFileUpload && (
                <FileUpload
                    onClose={() => setShowFileUpload(false)}
                />
            )}
        </>
    );
};

export default SidebarContainer;