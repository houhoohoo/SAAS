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
        isDeepResearching,
        isUploading,
        sendMessage,
        interruptConversation,
        uploadFiles, // 直接从context获取
        regenerateMessage,
        editMessage,
        onCopyMessage,
        onFavoriteMessage,
        onLikeMessage,
        isConnected,
        userInterests,
        toggleUserInterest,
        clearUserInterests,
        // 人工审核相关
        pendingInterrupts,
        activeInterrupt,
        selectInterrupt,
        resolveInterruptFileName,
        submitFeedback,
        cancelInterrupt,
    } = useChat();

    const conversation = conversations.find((c) => c.id === activeConversation);

    return (
        <>
            <ChatWindow
                conversation={conversation}
                isGenerating={isGenerating}
                isDeepResearching={isDeepResearching}
                isUploading={isUploading} // 传递上传状态
                onSendMessage={sendMessage}
                onInterrupt={interruptConversation}
                uploadFilesHandler={uploadFiles} // 直接使用context中的方法
                onRegenerate={regenerateMessage}
                onEditMessage={editMessage}
                onCopyMessage={onCopyMessage}
                onFavoriteMessage={onFavoriteMessage}
                onLikeMessage={onLikeMessage}
                isConnected={isConnected}
                userInterests={userInterests}
                onToggleInterest={toggleUserInterest}
                onClearInterests={clearUserInterests}
                // 人工审核相关
                pendingInterrupts={pendingInterrupts}
                activeInterrupt={activeInterrupt}
                selectInterrupt={selectInterrupt}
                resolveInterruptFileName={resolveInterruptFileName}
                onSubmitFeedback={submitFeedback}
                onCancelInterrupt={cancelInterrupt}
            />
            {showFileUpload && (
                <FileUpload onClose={() => setShowFileUpload(false)} />
            )}
        </>
    );
};

export default ChatWindowContainer;