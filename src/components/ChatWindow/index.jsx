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
        isUploading,
        sendMessage,
        interruptConversation,
        uploadFiles, // 直接从context获取
        regenerateMessage,
        editMessage,
        onCopyMessage,
        onFavoriteMessage,
        onLikeMessage,
    } = useChat();

    const conversation = conversations.find((c) => c.id === activeConversation);

    return (
        <>
            <ChatWindow
                conversation={conversation}
                isGenerating={isGenerating}
                isUploading={isUploading} // 传递上传状态
                onSendMessage={sendMessage}
                onInterrupt={interruptConversation}
                uploadFilesHandler={uploadFiles} // 直接使用context中的方法
                onRegenerate={regenerateMessage}
                onEditMessage={editMessage}
                onCopyMessage={onCopyMessage}
                onFavoriteMessage={onFavoriteMessage}
                onLikeMessage={onLikeMessage}
            />
            {showFileUpload && (
                <FileUpload onClose={() => setShowFileUpload(false)} />
            )}
        </>
    );
};

export default ChatWindowContainer;