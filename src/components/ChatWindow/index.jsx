import React from 'react';
import ChatWindow from './ChatWindow';
import { useChat } from '../../contexts/ChatContext';

const ChatWindowContainer = () => {
    const {
        conversations,
        activeConversation,
        isGenerating,
        sendMessage,
        interruptConversation
    } = useChat();

    const conversation = conversations.find(c => c.id === activeConversation);

    return (
        <ChatWindow
            conversation={conversation}
            isGenerating={isGenerating}
            onSendMessage={sendMessage}
            onInterrupt={interruptConversation}
        />
    );
};

export default ChatWindowContainer;