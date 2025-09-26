/* eslint-disable no-undef */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from "react";
import {
    getConversations,
    createConversation,
    deleteConversation,
    sendMessage,
    uploadFiles,
    interruptConversation,
    regenerateMessage,
    editMessage,
} from "../api/mockApi";

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);

    // 加载对话列表
    const loadConversations = async () => {
        setIsLoading(true);
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (err) {
            setError("加载对话失败");
            console.error("加载对话失败:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // 创建新对话
    const createNewConversation = async () => {
        try {
            const newConv = await createConversation();
            setConversations((prev) => [newConv, ...prev]);
            setActiveConversation(newConv.id);
            return newConv;
        } catch (err) {
            setError("创建对话失败");
            console.error("创建对话失败:", err);
            return null;
        }
    };

    // 删除对话
    const deleteConv = async (id) => {
        try {
            await deleteConversation(id);
            setConversations((prev) => prev.filter((conv) => conv.id !== id));
            if (activeConversation === id) {
                setActiveConversation(conversations[0]?.id || null);
            }
        } catch (err) {
            setError("删除对话失败");
            console.error("删除对话失败:", err);
        }
    };

    // 上传文件
    const uploadFilesHandler = async (files) => {
        if (!files || files.length === 0) return [];

        setIsUploading(true);
        try {
            const response = await uploadFiles(files);
            return response.files || [];
        } catch (err) {
            setError("上传文件失败");
            console.error("上传文件失败:", err);
            throw err; // 抛出错误让调用方处理
        } finally {
            setIsUploading(false);
        }
    };

    const regenerateMessageHandler = async (messageId) => {
        if (!activeConversation) {
            setError("请先选择对话");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await regenerateMessage(
                messageId,
                activeConversation
            );

            // 更新对话中的消息
            setConversations((prev) => {
                return prev.map((conv) => {
                    if (conv.id === activeConversation) {
                        return {
                            ...conv,
                            messages: conv.messages.map((msg) =>
                                msg.id === messageId ? response.newMessage : msg
                            ),
                        };
                    }
                    return conv;
                });
            });

            return response;
        } catch (err) {
            setError("重新生成消息失败");
            console.error("重新生成消息失败:", err);
            throw err;
        } finally {
            setIsGenerating(false);
        }
    };

    // 编辑消息
    // 编辑消息
    const editMessageHandler = async (messageId, newContent, files = []) => {
        if (!activeConversation) {
            setError("请先选择对话");
            return;
        }

        setIsGenerating(true);
        let uploadedFiles = [];

        try {
            // 如果有新文件，先上传文件
            if (files.length > 0) {
                uploadedFiles = await uploadFilesHandler(files);
            }

            // 调用编辑API
            const response = await editMessage(
                messageId,
                newContent,
                activeConversation
            );

            // 更新对话状态
            setConversations((prev) => {
                return prev.map((conv) => {
                    if (conv.id === activeConversation) {
                        // 找到编辑的消息位置
                        const messageIndex = conv.messages.findIndex(
                            (msg) => msg.id === messageId
                        );

                        if (messageIndex === -1) return conv;

                        // 创建更新后的消息数组
                        const updatedMessages = [...conv.messages];

                        // 更新用户消息
                        updatedMessages[messageIndex] = {
                            ...response.editedMessage,
                            files:
                                uploadedFiles.length > 0
                                    ? uploadedFiles
                                    : updatedMessages[messageIndex].files,
                        };

                        // 移除原AI回复（如果有），添加新AI回复
                        const nextIndex = messageIndex + 1;
                        let finalMessages = [];

                        // 保留编辑消息之前的所有消息
                        finalMessages = updatedMessages.slice(0, nextIndex);

                        // 添加新的AI回复
                        finalMessages.push(response.newResponse);

                        // 保留后续的用户消息（如果有）
                        let i = nextIndex;
                        while (i < updatedMessages.length) {
                            if (updatedMessages[i].sender === "user") {
                                finalMessages.push(updatedMessages[i]);
                                // 找到下一个用户消息后的AI消息（如果有）
                                let j = i + 1;
                                while (
                                    j < updatedMessages.length &&
                                    updatedMessages[j].sender === "ai"
                                ) {
                                    finalMessages.push(updatedMessages[j]);
                                    j++;
                                }
                                i = j;
                            } else {
                                i++;
                            }
                        }

                        return {
                            ...conv,
                            messages: finalMessages,
                        };
                    }
                    return conv;
                });
            });

            return response;
        } catch (err) {
            setError("编辑消息失败");
            console.error("编辑消息失败:", err);
            throw err;
        } finally {
            setIsGenerating(false);
        }
    };
    // 发送消息（支持文件上传）
    const sendNewMessage = async (message, files = []) => {
        // 如果没有活动对话，先创建新对话
        let currentConvId = activeConversation;
        let isNewConversation = false;

        if (!currentConvId) {
            const newConv = await createNewConversation();
            if (!newConv) return; // 创建失败
            currentConvId = newConv.id;
            isNewConversation = true;
        }

        setIsGenerating(true);
        let uploadedFiles = [];

        try {
            // 如果有文件，先上传文件
            if (files.length > 0) {
                uploadedFiles = await uploadFilesHandler(files);
            }

            // 先在前端添加用户消息（包含文件信息）
            setConversations((prev) => {
                return prev.map((conv) => {
                    if (conv.id === currentConvId) {
                        const newMessage = {
                            id: `temp-${Date.now()}`,
                            text: message,
                            sender: "user",
                            timestamp: new Date().toISOString(),
                            files:
                                uploadedFiles.length > 0
                                    ? uploadedFiles
                                    : undefined,
                        };

                        return {
                            ...conv,
                            messages: isNewConversation
                                ? [newMessage]
                                : [...conv.messages, newMessage],
                        };
                    }
                    return conv;
                });
            });

            // 发送API请求（传递文件信息）
            const response = await sendMessage(
                currentConvId,
                message,
                uploadedFiles
            );

            // 更新对话状态，移除临时消息，添加API返回的正式消息
            setConversations((prev) => {
                return prev.map((conv) => {
                    if (conv.id === currentConvId) {
                        return {
                            ...conv,
                            messages: [
                                // 保留非临时消息（防止重复）
                                ...conv.messages.filter(
                                    (msg) => !msg.id.startsWith("temp")
                                ),
                                // 添加API返回的消息
                                ...response.messages,
                            ],
                        };
                    }
                    return conv;
                });
            });
        } catch (err) {
            setError("发送消息失败");
            console.error("发送消息失败:", err);

            // 发送失败时移除临时消息
            setConversations((prev) => {
                return prev.map((conv) => {
                    if (conv.id === currentConvId) {
                        return {
                            ...conv,
                            messages: conv.messages.filter(
                                (msg) => !msg.id.startsWith("temp")
                            ),
                        };
                    }
                    return conv;
                });
            });
        } finally {
            setIsGenerating(false);
        }
    };

    // 中断对话
    const interruptConv = async () => {
        try {
            await interruptConversation();
            setIsGenerating(false);
        } catch (err) {
            setError("中断对话失败");
            console.error("中断对话失败:", err);
        }
    };

    useEffect(() => {
        loadConversations();
    }, []);

    const value = {
        conversations,
        activeConversation,
        isLoading,
        isGenerating,
        isUploading, // 新增上传状态
        error,
        setActiveConversation,
        createNewConversation,
        deleteConversation: deleteConv,
        sendMessage: sendNewMessage,
        uploadFiles: uploadFilesHandler, // 单独的文件上传方法
        interruptConversation: interruptConv,
        regenerateMessage: regenerateMessageHandler, // 新增
        editMessage: editMessageHandler, // 新增
        onCopyMessage: (messageId) => console.log("复制消息:", messageId),
        onFavoriteMessage: (messageId) => console.log("收藏消息:", messageId),
        onLikeMessage: (messageId) => console.log("点赞消息:", messageId),
    };

    return (
        <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    );
};
