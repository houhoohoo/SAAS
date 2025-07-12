import React, { useState } from "react";
import ChatWindow from "./ChatWindow";
import FileUpload from "../FileUpload";
import { useChat } from "../../contexts/ChatContext";

const ChatWindowContainer = () => {
    const [showFileUpload, setShowFileUpload] = useState(false);
    const {
        conversations,
        activeConversation,
        isGenerating,
        sendMessage,
        interruptConversation,
    } = useChat();

    const conversation = conversations.find((c) => c.id === activeConversation);

    return (
        <>
            <ChatWindow
                conversation={conversation}
                isGenerating={isGenerating}
                onSendMessage={sendMessage}
                onInterrupt={interruptConversation}
                onShowFileUpload={() => setShowFileUpload(true)}
            />
            {showFileUpload && (
                <FileUpload onClose={() => setShowFileUpload(false)} />
            )}
        </>
    );
};

export default ChatWindowContainer;
