/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext, useEffect } from "react";
import {
    getConversations,
    createConversation,
    deleteConversation,
    sendMessage,
    uploadFiles,
    interruptConversation,
} from "../api/mockApi";

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState(null);

    // 加载对话列表
    const loadConversations = async () => {
        setIsLoading(true);
        try {
            const data = await getConversations();
            setConversations(data);
            // if (data.length > 0 && !activeConversation) {
            //     setActiveConversation(data[0].id);
            // }
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

    // 发送消息 (修复后的版本)
    const sendNewMessage = async (message) => {
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

        try {
            // 先在前端添加用户消息
            setConversations((prev) => {
                return prev.map((conv) => {
                    if (conv.id === currentConvId) {
                        // 对于新对话，创建消息数组；对于现有对话，添加消息
                        const newMessage = {
                            id: `temp-${Date.now()}`,
                            text: message,
                            sender: "user",
                            timestamp: new Date().toISOString(),
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

            // 发送API请求
            const response = await sendMessage(currentConvId, message);

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

    // 上传文件
    const uploadFilesHandler = async (files) => {
        try {
            const response = await uploadFiles(files);
            return response.files;
        } catch (err) {
            setError("上传文件失败");
            console.error("上传文件失败:", err);
            return [];
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
        error,
        setActiveConversation,
        createNewConversation,
        deleteConversation: deleteConv,
        sendMessage: sendNewMessage,
        uploadFiles: uploadFilesHandler,
        interruptConversation: interruptConv,
    };

    return (
        <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    );
};
