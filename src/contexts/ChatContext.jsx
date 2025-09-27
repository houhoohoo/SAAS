/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from "react";

import {
    initWebSocket,
    getConversations,
    createConversation,
    deleteConversation,
    sendMessage,
    uploadFiles,
    interruptConversation,
    regenerateMessage,
    editMessage,
    subscribeToEvents,
    disconnectWebSocket,
    MESSAGE_TYPES,
} from "../api/websocketApi";

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadedFilesCache, setUploadedFilesCache] = useState(new Map());
    const [isConnected, setIsConnected] = useState(false); //   WebSocket连接状态
    // 初始化WebSocket连接
    useEffect(() => {
        const initializeConnection = async () => {
            try {
                const connected = await initWebSocket();
                setIsConnected(connected);

                if (connected) {
                    // 订阅服务端推送事件
                    const unsubscribe = subscribeToEvents({
                        onConversationCreated: (conversation) => {
                            setConversations((prev) => [conversation, ...prev]);
                        },

                        onConversationDeleted: ({ conversationId }) => {
                            setConversations((prev) =>
                                prev.filter(
                                    (conv) => conv.id !== conversationId
                                )
                            );
                            if (activeConversation === conversationId) {
                                setActiveConversation(
                                    conversations[0]?.id || null
                                );
                            }
                        },
                        onMessageSent: ({ conversationId, messages }) => {
                            console.log(
                                "收到消息发送事件:",
                                conversationId,
                                messages
                            );

                            setConversations((prev) =>
                                prev.map((conv) => {
                                    if (conv.id === conversationId) {
                                        // 移除临时消息
                                        const filteredMessages =
                                            conv.messages.filter(
                                                (msg) =>
                                                    !msg.id.startsWith("temp")
                                            );

                                        // 添加新消息（主要是AI消息）
                                        return {
                                            ...conv,
                                            messages: [
                                                ...filteredMessages,
                                                ...messages,
                                            ],
                                        };
                                    }
                                    return conv;
                                })
                            );

                            setIsGenerating(false);
                        },

                        onMessageUpdated: ({
                            conversationId,
                            messageId,
                            newMessage,
                        }) => {
                            setConversations((prev) =>
                                prev.map((conv) => {
                                    if (conv.id === conversationId) {
                                        return {
                                            ...conv,
                                            messages: conv.messages.map((msg) =>
                                                msg.id === messageId
                                                    ? newMessage
                                                    : msg
                                            ),
                                        };
                                    }
                                    return conv;
                                })
                            );
                        },

                        onError: (error) => {
                            setError(error.message || "发生错误");
                            console.error("服务端错误:", error);
                        },
                    });

                    // 加载初始对话列表
                    await loadConversations();

                    return unsubscribe;
                }
            } catch (error) {
                console.error("初始化失败:", error);
                setError("连接服务器失败");
            } finally {
                setIsLoading(false);
            }
        };

        const unsubscribePromise = initializeConnection();

        return () => {
            unsubscribePromise.then((unsubscribe) => {
                if (unsubscribe) unsubscribe();
                disconnectWebSocket();
            });
        };
    }, []);
    // 加载对话列表
    const loadConversations = async () => {
        if (!isConnected) return;
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
            // 确保 files 包含必要的文件信息
            const validFiles = files.map((file) => ({
                name: file.name || "unknown",
                size: file.size || 0,
                type: file.type || "application/octet-stream",
                lastModified: file.lastModified || Date.now(),
                // 其他必要属性...
            }));

            console.log("上传文件信息:", validFiles); // 调试日志

            const response = await uploadFiles(validFiles);
            return response.files || [];
        } catch (err) {
            setError("上传文件失败");
            console.error("上传文件失败:", err);
            throw err;
        } finally {
            setIsUploading(false);
        }
    };
    // 发送消息
    const sendNewMessage = async (message, uploadedFiles = []) => {
        let currentConvId = activeConversation;
        let isNewConversation = false;

        if (!currentConvId) {
            const newConv = await createNewConversation();
            if (!newConv) return;
            currentConvId = newConv.id;
            isNewConversation = true;
        }

        setIsGenerating(true);

        try {
            // 添加临时用户消息（包含文件信息）
            setConversations((prev) =>
                prev.map((conv) => {
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
                            isTemp: true,
                        };

                        return {
                            ...conv,
                            messages: isNewConversation
                                ? [newMessage]
                                : [...conv.messages, newMessage],
                        };
                    }
                    return conv;
                })
            );

            // 发送消息到服务器（包含文件ID引用）
            await sendMessage(currentConvId, message, uploadedFiles);
        } catch (err) {
            setError("发送消息失败");
            console.error("发送消息失败:", err);

            // 移除临时消息
            setConversations((prev) =>
                prev.map((conv) => {
                    if (conv.id === currentConvId) {
                        return {
                            ...conv,
                            messages: conv.messages.filter(
                                (msg) => !msg.isTemp
                            ),
                        };
                    }
                    return conv;
                })
            );
            setIsGenerating(false);
        }
    };

    const regenerateMessageHandler = async (messageId) => {
        if (!activeConversation) {
            setError("请先选择对话");
            return;
        }

        setIsGenerating(true);
        try {
            regenerateMessage(messageId, activeConversation);
        } catch (err) {
            setError("重新生成消息失败");
            console.error("重新生成消息失败:", err);
            throw err;
        } finally {
            setIsGenerating(false);
        }
    };

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

            await editMessage(messageId, newContent, activeConversation);
        } catch (err) {
            setError("编辑消息失败");
            console.error("编辑消息失败:", err);
            throw err;
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

    const value = {
        conversations,
        activeConversation,
        isLoading,
        isGenerating,
        isUploading, // 新增上传状态
        error,
        isConnected,
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
