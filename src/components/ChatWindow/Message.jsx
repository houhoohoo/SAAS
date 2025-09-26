import React, { useState } from "react";
import Icon from "../common/Icon";
import ToastMessage from "../common/ToastMessage";
import styles from "./ChatWindow.module.css";

const Message = ({
    message,
    onRegenerate,
    onEdit,
    onFavorite,
    onLike,
    isEditing,
}) => {
    const isAI = message.sender === "ai";
    const timestamp = new Date(message.timestamp);

    const [showToast, setShowToast] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.text);
            setShowToast(true);
        } catch (err) {
            console.error("复制失败:", err);
        }
    };

    return (
        <div className={styles.messageWrapper}>
            {/* 顶部复制提示 */}
            {showToast && (
                <ToastMessage
                    message="已复制到剪贴板"
                    onClose={() => setShowToast(false)}
                />
            )}

            <div
                className={`${styles.message} ${
                    isAI ? styles.aiMessage : styles.userMessage
                } ${isEditing ? styles.editingMessage : ""}`}>
                <div className={styles.content}>
                    <div
                        className={`${styles.text} ${
                            isAI ? styles.aiText : ""
                        }`}>
                        {message.text}
                    </div>
                </div>

                <div className={styles.messageActions}>
                    <button onClick={handleCopy} title="复制">
                        <Icon name="CopyOutlined" size={16} />
                    </button>

                    {isAI ? (
                        <>
                            <button onClick={onRegenerate} title="重新生成">
                                <Icon name="ReloadOutlined" size={16} />
                            </button>
                            <button onClick={onFavorite} title="收藏">
                                <Icon name="StarOutlined" size={16} />
                            </button>
                            <button onClick={onLike} title="点赞">
                                <Icon name="LikeOutlined" size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={onEdit} title="编辑">
                                <Icon name="EditOutlined" size={16} />
                            </button>
                        </>
                    )}

                    <div className={styles.timestamp}>
                        {timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Message;
