/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    useRef,
    useMemo,
    useCallback,
} from "react";

import {
    uploadFilesHttp,
    streamChatEvaluate,
    chatControl,
} from "../api/websocketApi";

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isDeepResearching, setIsDeepResearching] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [userInterests, setUserInterests] = useState([]);
    const [uploadedFilesCache, setUploadedFilesCache] = useState(new Map());
    const [isConnected, setIsConnected] = useState(true); // 以HTTP/SSE为主，视为可用
    const [pendingInterrupts, setPendingInterrupts] = useState([]); // 待处理的人工审核中断队列
    const [activeInterruptIndex, setActiveInterruptIndex] = useState(0);
    const sseControllerRef = useRef(null);

    const makeInterruptKey = (interrupt = {}) =>
        `${interrupt?.thread_id ?? "global"}::${interrupt?.file_id ?? "all"}`;

    const updateInterruptQueue = useCallback((updater, nextActiveKey = null) => {
        let nextQueueSnapshot = [];
        setPendingInterrupts((prev) => {
            const next = updater(prev) || [];
            nextQueueSnapshot = next;
            return next;
        });

        setActiveInterruptIndex((prevIndex) => {
            if (nextQueueSnapshot.length === 0) {
                return 0;
            }

            if (nextActiveKey) {
                const targetIndex = nextQueueSnapshot.findIndex(
                    (interrupt) => makeInterruptKey(interrupt) === nextActiveKey
                );
                if (targetIndex !== -1) {
                    return targetIndex;
                }
            }

            return Math.min(Math.max(prevIndex, 0), nextQueueSnapshot.length - 1);
        });
    }, []);

    const activeInterrupt = useMemo(() => {
        if (pendingInterrupts.length === 0) return null;
        const index = Math.min(activeInterruptIndex, pendingInterrupts.length - 1);
        return pendingInterrupts[index];
    }, [pendingInterrupts, activeInterruptIndex]);

    const selectInterrupt = useCallback((index) => {
        setActiveInterruptIndex((prev) => {
            if (!Number.isFinite(index)) return prev;
            return Math.max(0, index);
        });
    }, []);

    const resolveInterruptFileName = useCallback(
        (threadId, fileId) => {
            if (!fileId) return "全部文件";

            const searchConversations = conversations.filter((conv) => {
                if (!threadId) return true;
                return conv.threadId === threadId;
            });

            for (const conv of searchConversations) {
                const progressEntry = conv.fileProgress?.[fileId];
                if (progressEntry?.name) return progressEntry.name;

                const messageFile = conv.messages
                    ?.flatMap((msg) => msg.files || [])
                    .find((file) => file?.id === fileId);
                if (messageFile?.name) return messageFile.name;
            }

            const cachedFile = uploadedFilesCache.get(fileId);
            if (cachedFile?.name) return cachedFile.name;

            return fileId;
        },
        [conversations, uploadedFilesCache]
    );

    const removeInterruptByKey = useCallback(
        (threadId, fileId) => {
            const keyToRemove = makeInterruptKey({ thread_id: threadId, file_id: fileId });
            updateInterruptQueue(
                (prev) =>
                    prev.filter((interrupt) => makeInterruptKey(interrupt) !== keyToRemove),
                null
            );
        },
        [updateInterruptQueue]
    );

    const normalizeInterruptTarget = useCallback(
        (target) => {
            if (!target) {
                if (!activeInterrupt) return {};
                return {
                    threadId: activeInterrupt.thread_id,
                    fileId: activeInterrupt.file_id,
                };
            }

            if (typeof target === "object") {
                if (target.thread_id || target.file_id) {
                    return {
                        threadId: target.thread_id,
                        fileId: target.file_id,
                    };
                }

                if (target.threadId || target.fileId) {
                    return {
                        threadId: target.threadId,
                        fileId: target.fileId,
                    };
                }
            }

            return {
                fileId: target,
            };
        },
        [activeInterrupt]
    );
    // 初始化（SSE模式不需要持久连接，仅设置初始状态）
    useEffect(() => {
        const initialize = async () => {
            try {
                setIsConnected(true);
                await loadConversations();
            } catch (error) {
                console.error("初始化失败:", error);
                setError("初始化失败");
            } finally {
                setIsLoading(false);
            }
        };
        initialize();
        return () => {
            if (sseControllerRef.current) {
                sseControllerRef.current.abort();
                sseControllerRef.current = null;
            }
        };
    }, []);
    // 加载对话列表
    const loadConversations = async () => {
        // SSE模式：本地管理对话列表，初始为空
        setConversations((prev) => prev || []);
    };

    // 创建新对话
    const createNewConversation = async () => {
        try {
            const newConv = {
                id: `conv-${Date.now()}`,
                title: "新对话",
                createdAt: new Date().toISOString(),
                messages: [],
                threadId: null,
            };
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
            setConversations((prev) => prev.filter((conv) => conv.id !== id));
            if (activeConversation === id) {
                setActiveConversation((prev) => {
                    const rest = conversations.filter((c) => c.id !== id);
                    return rest[0]?.id || null;
                });
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
            const response = await uploadFilesHttp(files);
            return response;
        } catch (err) {
            setError("上传文件失败");
            console.error("上传文件失败:", err);
            throw err;
        } finally {
            setIsUploading(false);
        }
    };
    // 发送消息
    const sendNewMessage = async (message, uploadedFiles = [], userInterest = []) => {
        let currentConvId = activeConversation;
        let isNewConversation = false;

        if (!currentConvId) {
            const newConv = await createNewConversation();
            if (!newConv) return;
            currentConvId = newConv.id;
            isNewConversation = true;
        }

        const currentConversation = conversations.find((conv) => conv.id === currentConvId) || null;

        setIsGenerating(true);
        setIsDeepResearching(true);

        try {
            const tempId = `temp-${Date.now()}`;
            const filesToAttach = uploadedFiles.length > 0 ? uploadedFiles : undefined;

            setConversations((prev) => {
                const placeholderId = `${tempId}-ai`;
                const tempMessage = {
                    id: tempId,
                    text: message,
                    sender: "user",
                    timestamp: new Date().toISOString(),
                    files: filesToAttach,
                    isTemp: true,
                };

                const placeholderAiMessage = {
                    id: placeholderId,
                    text: "正在思考...",
                    sender: "ai",
                    timestamp: new Date().toISOString(),
                    isPlaceholder: true,
                    files: filesToAttach,
                };

                return prev.map((conv) => {
                    if (conv.id !== currentConvId) return conv;

                    const withoutPlaceholders = conv.messages.filter(
                        (msg) => !msg.isPlaceholder
                    );

                    if (isNewConversation || withoutPlaceholders.length === 0) {
                        return {
                            ...conv,
                            messages: [tempMessage, placeholderAiMessage],
                        };
                    }

                    return {
                        ...conv,
                        messages: [...withoutPlaceholders, tempMessage, placeholderAiMessage],
                    };
                });
            });

            if (sseControllerRef.current) {
                sseControllerRef.current.abort();
            }

            const sseController = new AbortController();
            sseControllerRef.current = sseController;

            let accumulatedText = "";
            let activeThreadId = null;

            streamChatEvaluate({
                message,
                files: filesToAttach,
                fileIds: filesToAttach?.map((file) => file.id) || [],
                userInterest: userInterest.length ? userInterest : userInterests,
                threadId: currentConversation?.threadId || null,
                signal: sseController.signal,
                onFileStart: (fileData = {}) => {
                    const fileId = fileData.file_id;
                    if (!fileId) return;

                    setConversations((prev) =>
                        prev.map((conv) => {
                            if (conv.id !== currentConvId) return conv;
                            return {
                                ...conv,
                                fileProgress: {
                                    ...conv.fileProgress,
                                    [fileId]: { status: "processing", progress: 0 }
                                }
                            };
                        })
                    );
                },
                onFileStageComplete: (fileData = {}) => {
                    const fileId = fileData.file_id;
                    if (!fileId) return;

                    setConversations((prev) =>
                        prev.map((conv) => {
                            if (conv.id !== currentConvId) return conv;
                            return {
                                ...conv,
                                fileProgress: {
                                    ...conv.fileProgress,
                                    [fileId]: { status: "completed", progress: 100 }
                                }
                            };
                        })
                    );
                },
                onFileDone: (fileData = {}) => {
                    const fileId = fileData.file_id;
                    if (!fileId) return;

                    setConversations((prev) =>
                        prev.map((conv) => {
                            if (conv.id !== currentConvId) return conv;
                            return {
                                ...conv,
                                fileProgress: {
                                    ...conv.fileProgress,
                                    [fileId]: { status: "done", progress: 100 }
                                }
                            };
                        })
                    );
                },
                onFileError: (fileData = {}) => {
                    const fileId = fileData.file_id;
                    if (!fileId) return;

                    setConversations((prev) =>
                        prev.map((conv) => {
                            if (conv.id !== currentConvId) return conv;
                            return {
                                ...conv,
                                fileProgress: {
                                    ...conv.fileProgress,
                                    [fileId]: { 
                                        status: "error", 
                                        progress: 0, 
                                        error: fileData.message || "处理失败" 
                                    }
                                }
                            };
                        })
                    );
                },
                onSession: ({ thread_id }) => {
                    if (!thread_id) return;
                    activeThreadId = thread_id;
                    setConversations((prev) =>
                        prev.map((conv) =>
                            conv.id === currentConvId
                                ? { ...conv, threadId: thread_id }
                                : conv
                        )
                    );
                },
                onDelta: ({ delta }) => {
                    if (!delta) return;
                    accumulatedText += delta;

                    setConversations((prev) =>
                        prev.map((conv) => {
                            if (conv.id !== currentConvId) return conv;

                            const updatedMessages = conv.messages.map((msg) => {
                                if (msg.isPlaceholder && msg.id === `${tempId}-ai`) {
                                    return {
                                        ...msg,
                                        text: accumulatedText,
                                    };
                                }
                                return msg;
                            });

                            return {
                                ...conv,
                                messages: updatedMessages,
                            };
                        })
                    );
                },
                onComplete: ({ reply, files: responseFiles }) => {
                    if (!reply) return;
                    accumulatedText = reply;

                    setConversations((prev) =>
                        prev.map((conv) => {
                            if (conv.id !== currentConvId) return conv;

                            const updatedMessages = conv.messages.map((msg) => {
                                if (msg.isPlaceholder && msg.id === `${tempId}-ai`) {
                                    return {
                                        ...msg,
                                        text: reply,
                                        isPlaceholder: false,
                                        files: responseFiles || msg.files,
                                    };
                                }
                                return msg;
                            });

                            return {
                                ...conv,
                                messages: updatedMessages,
                            };
                        })
                    );
                },
                onReportReady: (reportData = {}) => {
                    // 处理 downloads 对象中的文件
                    const downloads = reportData.downloads || {};
                    const filesToAdd = [];

                    // 处理 report 文件
                    if (downloads.report) {
                        filesToAdd.push({
                            id: `report-${Date.now()}`,
                            name: "项目评估报告.pdf",
                            type: "application/pdf",
                            url: downloads.report,
                        });
                    }

                    // 处理其他可能的文件
                    Object.entries(downloads).forEach(([key, url]) => {
                        if (key !== "report" && url) {
                            const fileExtension = url.split(".").pop()?.toLowerCase();
                            const mimeType = fileExtension === "pdf" ? "application/pdf" : "application/octet-stream";
                            
                            filesToAdd.push({
                                id: `${key}-${Date.now()}`,
                                name: `${key}.${fileExtension || "pdf"}`,
                                type: mimeType,
                                url: url,
                            });
                        }
                    });

                    if (filesToAdd.length === 0) return;

                    setConversations((prev) =>
                        prev.map((conv) => {
                            if (conv.id !== currentConvId) return conv;

                            const updatedMessages = conv.messages.map((msg) => {
                                // 匹配 AI 消息，无论是占位符还是已完成的消息
                                if (msg.sender === "ai" && (msg.id === `${tempId}-ai` || msg.id.includes(tempId))) {
                                    const existingFiles = msg.files || [];
                                    
                                    // 合并新文件，避免重复
                                    const mergedFiles = [...existingFiles];
                                    filesToAdd.forEach((newFile) => {
                                        const alreadyExists = mergedFiles.some((existing) => {
                                            if (existing.url && newFile.url) {
                                                return existing.url === newFile.url;
                                            }
                                            return existing.name === newFile.name;
                                        });
                                        
                                        if (!alreadyExists) {
                                            mergedFiles.push(newFile);
                                        }
                                    });

                                    return {
                                        ...msg,
                                        files: mergedFiles,
                                    };
                                }
                                return msg;
                            });

                            return {
                                ...conv,
                                messages: updatedMessages,
                            };
                        })
                    );
                },
                onDone: ({ files: responseFiles } = {}) => {
                    // 将用户临时消息固化
                    setConversations((prev) =>
                        prev.map((conv) => {
                            if (conv.id !== currentConvId) return conv;
                            const updated = conv.messages.map((msg) => {
                                if (msg.id === tempId && msg.isTemp) {
                                    return {
                                        ...msg,
                                        id: `msg-${Date.now()}-user`,
                                        isTemp: false,
                                        files: filesToAttach,
                                    };
                                }
                                if (msg.id === `${tempId}-ai` && !msg.isPlaceholder) {
                                    const existingFiles = msg.files || [];
                                    const newFilesFromResponse = Array.isArray(responseFiles)
                                        ? responseFiles.filter(Boolean)
                                        : [];

                                    const mergedFiles = [...existingFiles];

                                    newFilesFromResponse.forEach((file) => {
                                        const alreadyExists = mergedFiles.some((existing) => {
                                            if (existing.url && file.url) {
                                                return existing.url === file.url;
                                            }
                                            if (existing.id && file.id) {
                                                return existing.id === file.id;
                                            }
                                            return existing.name === file.name;
                                        });

                                        if (!alreadyExists) {
                                            mergedFiles.push(file);
                                        }
                                    });

                                    return { ...msg, files: mergedFiles };
                                }
                                return msg;
                            });
                            // 更新对话标题：首条用户消息作为标题
                            let newTitle = conv.title;
                            if (updated.length >= 1 && (!conv.title || conv.title === "新对话")) {
                                const firstUser = updated.find((m) => m.sender === "user");
                                if (firstUser?.text) {
                                    const t = firstUser.text;
                                    newTitle = t.substring(0, 20) + (t.length > 20 ? "..." : "");
                                }
                            }
                            return { ...conv, messages: updated, title: newTitle };
                        })
                    );
                    setIsGenerating(false);
                    setIsDeepResearching(false);
                    updateInterruptQueue((prev) =>
                        prev.filter((interrupt) => makeInterruptKey(interrupt) !== makeInterruptKey(payload))
                    );
                    sseControllerRef.current = null;
                },
                onError: (payload = {}) => {
                    const messageText = payload?.message || "SSE 连接失败";
                    const fileId = payload?.file_id;

                    setError(messageText);
                    setIsGenerating(false);
                    setIsDeepResearching(false);
                    updateInterruptQueue((prev) =>
                        prev.filter((interrupt) => makeInterruptKey(interrupt) !== makeInterruptKey(payload))
                    );

                    setConversations((prev) =>
                        prev.map((conv) => {
                            if (conv.id !== currentConvId) return conv;

                            const updatedMessages = conv.messages.map((msg) => {
                                if (msg.id === tempId) {
                                    return {
                                        ...msg,
                                        isTemp: false,
                                    };
                                }

                                if (msg.id === `${tempId}-ai`) {
                                    return {
                                        ...msg,
                                        text: messageText,
                                        isPlaceholder: false,
                                        isError: true,
                                    };
                                }

                                return msg;
                            });

                            const filteredMessages = updatedMessages.filter((msg) => msg.id !== `${tempId}-ai` || !msg.isPlaceholder);

                            const updatedFileProgress = fileId
                                ? {
                                      ...(conv.fileProgress || {}),
                                      [fileId]: {
                                          status: "error",
                                          progress: 0,
                                          error: messageText,
                                      },
                                  }
                                : conv.fileProgress;

                            return {
                                ...conv,
                                messages: filteredMessages,
                                fileProgress: updatedFileProgress,
                            };
                        })
                    );

                    sseControllerRef.current = null;
                },
                onInterrupt: (payload) => {
                    // 处理人工审核中断
                    console.log("收到人工审核中断:", payload);
                    updateInterruptQueue((prev) => {
                        const existingIndex = prev.findIndex((interrupt) => makeInterruptKey(interrupt) === makeInterruptKey(payload));
                        if (existingIndex !== -1) {
                            const updated = [...prev];
                            updated[existingIndex] = payload;
                            return updated;
                        }
                        return [...prev, payload];
                    });
                    setIsGenerating(false);
                    setIsDeepResearching(false);
                },
                onReportComplete: ({ report }) => {
                    const finalText = report || accumulatedText;
                    setConversations(prev =>
                      prev.map(conv => {
                        if (conv.id !== currentConvId) return conv;
                        return {
                          ...conv,
                          messages: conv.messages.map(msg =>
                            msg.isPlaceholder && msg.id === `${tempId}-ai`
                              ? { ...msg, text: finalText, isPlaceholder: false }
                              : msg
                          ),
                        };
                      })
                    );
                  },
                  onReportDelta: ({ delta }) => {
                    if (!delta) return;
                    accumulatedText += delta;
                    setConversations(prev =>
                      prev.map(conv => {
                        if (conv.id !== currentConvId) return conv;
                        return {
                          ...conv,
                          messages: conv.messages.map(msg =>
                            msg.isPlaceholder && msg.id === `${tempId}-ai`
                              ? { ...msg, text: accumulatedText }
                              : msg
                          ),
                        };
                      })
                    );
                  },
            }).catch((err) => {
                console.error("SSE 处理失败:", err);
                setError(err.message || "SSE 连接失败");
                setIsGenerating(false);
                setIsDeepResearching(false);
                sseControllerRef.current = null;
            });
        } catch (err) {
            setError("发送消息失败");
            console.error("发送消息失败:", err);

            // 移除临时消息和占位符
            setConversations((prev) =>
                prev.map((conv) => {
                    if (conv.id === currentConvId) {
                        return {
                            ...conv,
                            messages: conv.messages.filter(
                                (msg) =>
                                    msg.id !== tempId &&
                                    msg.id !== `${tempId}-ai`
                            ),
                        };
                    }
                    return conv;
                })
            );

            if (sseControllerRef.current) {
                sseControllerRef.current.abort();
                sseControllerRef.current = null;
            }

            setIsGenerating(false);
            setIsDeepResearching(false);
        }
    };

    const regenerateMessageHandler = async (messageId) => {
        if (!activeConversation) {
            setError("请先选择对话");
            return;
        }

        const conv = conversations.find((c) => c.id === activeConversation);
        if (!conv) return;

        // 找到目标AI消息与其前一条用户消息
        const aiIndex = conv.messages.findIndex((m) => m.id === messageId);
        if (aiIndex === -1) return;
        const userMsg = [...conv.messages].slice(0, aiIndex).reverse().find((m) => m.sender === "user");
        const userText = userMsg?.text || "";

        if (!userText) {
            setError("未找到可用于重生的用户消息");
            return;
        }

        setIsGenerating(true);
        setIsDeepResearching(true);

        try {
            const placeholderId = `${messageId}-regen`;
            let accumulatedText = "";

            // 将目标AI消息标记为占位并清空内容
            setConversations((prev) => prev.map((c) => {
                if (c.id !== conv.id) return c;
                return {
                    ...c,
                    messages: c.messages.map((m, idx) => idx === aiIndex ? { ...m, id: placeholderId, text: "正在deep research...", isPlaceholder: true } : m)
                };
            }));

            const sseController = new AbortController();
            if (sseControllerRef.current) sseControllerRef.current.abort();
            sseControllerRef.current = sseController;

            await streamChatEvaluate({
                message: userText,
                files: conv.messages[aiIndex]?.files || [],
                fileIds: [],
                userInterest: [],
                threadId: conv.threadId || null,
                signal: sseController.signal,
                onSession: ({ thread_id }) => {
                    if (!thread_id) return;
                    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, threadId: thread_id } : c));
                },
                onDelta: ({ delta }) => {
                    if (!delta) return;
                    accumulatedText += delta;
                    setConversations((prev) => prev.map((c) => {
                        if (c.id !== conv.id) return c;
                        return {
                            ...c,
                            messages: c.messages.map((m) => m.id === placeholderId ? { ...m, text: accumulatedText } : m)
                        };
                    }));
                },
                onComplete: ({ reply, files: responseFiles }) => {
                    const text = reply || accumulatedText;
                    setConversations((prev) => prev.map((c) => {
                        if (c.id !== conv.id) return c;
                        return {
                            ...c,
                            messages: c.messages.map((m) => m.id === placeholderId ? { ...m, text, isPlaceholder: false, files: responseFiles || m.files } : m)
                        };
                    }));
                },
                onDone: () => {
                    setIsGenerating(false);
                    setIsDeepResearching(false);
                    sseControllerRef.current = null;
                },
                onError: (payload) => {
                    const messageText = payload?.message || "SSE 连接失败";
                    setError(messageText);
                    setIsGenerating(false);
                    setIsDeepResearching(false);
                    sseControllerRef.current = null;
                },
            });
        } catch (err) {
            console.error("重新生成消息失败:", err);
            setError("重新生成消息失败");
            setIsGenerating(false);
            setIsDeepResearching(false);
            if (sseControllerRef.current) {
                sseControllerRef.current.abort();
                sseControllerRef.current = null;
            }
        }
    };

    // 编辑消息
    const editMessageHandler = async (messageId, newContent, files = []) => {
        if (!activeConversation) {
            setError("请先选择对话");
            return;
        }

        const conv = conversations.find((c) => c.id === activeConversation);
        if (!conv) return;

        // 如果有新文件，先通过HTTP上传（可选）
        let uploaded = [];
        try {
            if (files.length > 0) {
                uploaded = await uploadFilesHttp(files);
            }
        } catch (e) {
            console.error("上传文件失败:", e);
        }

        setIsGenerating(true);
        setIsDeepResearching(true);

        // 替换用户消息，并截断后续消息，插入AI占位
        const idx = conv.messages.findIndex((m) => m.id === messageId);
        if (idx === -1) return;

        const placeholderId = `${messageId}-ai-edit-${Date.now()}`;
        setConversations((prev) => prev.map((c) => {
            if (c.id !== conv.id) return c;
            const newUserMsg = {
                ...c.messages[idx],
                text: newContent,
                files: uploaded.length > 0 ? uploaded : c.messages[idx].files,
            };
            const truncated = c.messages.slice(0, idx + 1);
            return {
                ...c,
                messages: [
                    ...truncated.map((m, i) => (i === idx ? newUserMsg : m)),
                    { id: placeholderId, text: "正在思考...", sender: "ai", timestamp: new Date().toISOString(), isPlaceholder: true },
                ],
            };
        }));

        try {
            const sseController = new AbortController();
            if (sseControllerRef.current) sseControllerRef.current.abort();
            sseControllerRef.current = sseController;

            let accumulatedText = "";
            await streamChatEvaluate({
                message: newContent,
                fileIds: [],
                userInterest: [],
                threadId: conv.threadId || null,
                signal: sseController.signal,
                onSession: ({ thread_id }) => {
                    if (!thread_id) return;
                    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, threadId: thread_id } : c));
                },
                onDelta: ({ delta }) => {
                    if (!delta) return;
                    accumulatedText += delta;
                    setConversations((prev) => prev.map((c) => {
                        if (c.id !== conv.id) return c;
                        return {
                            ...c,
                            messages: c.messages.map((m) => m.id === placeholderId ? { ...m, text: accumulatedText } : m)
                        };
                    }));
                },
                onComplete: ({ reply }) => {
                    const text = reply || accumulatedText;
                    setConversations((prev) => prev.map((c) => {
                        if (c.id !== conv.id) return c;
                        return {
                            ...c,
                            messages: c.messages.map((m) => m.id === placeholderId ? { ...m, text, isPlaceholder: false } : m)
                        };
                    }));
                },
                onDone: () => {
                    setIsGenerating(false);
                    setIsDeepResearching(false);
                    sseControllerRef.current = null;
                },
                onError: (payload) => {
                    const messageText = payload?.message || "SSE 连接失败";
                    setError(messageText);
                    setIsGenerating(false);
                    setIsDeepResearching(false);
                    sseControllerRef.current = null;
                },
            });
        } catch (err) {
            setError("编辑消息失败");
            console.error("编辑消息失败:", err);
            setIsGenerating(false);
            setIsDeepResearching(false);
            if (sseControllerRef.current) {
                sseControllerRef.current.abort();
                sseControllerRef.current = null;
            }
            throw err;
        }
    };

    // 中断对话
    const interruptConv = async () => {
        try {
            if (sseControllerRef.current) {
                sseControllerRef.current.abort();
                sseControllerRef.current = null;
            }
            setIsGenerating(false);
            setIsDeepResearching(false);
        } catch (err) {
            setError("中断对话失败");
            console.error("中断对话失败:", err);
        }
    };

    const toggleUserInterest = (interest) => {
        const normalized = (interest || "").trim();
        if (!normalized) return;

        setUserInterests((prev) => {
            if (prev.includes(normalized)) {
                return prev.filter((item) => item !== normalized);
            }
            return [...prev, normalized];
        });
    };

    const clearUserInterests = () => setUserInterests([]);

    const value = {
        conversations,
        activeConversation,
        isLoading,
        isGenerating,
        isDeepResearching,
        isUploading, // 新增上传状态
        error,
        isConnected,
        userInterests,
        setUserInterests,
        toggleUserInterest,
        clearUserInterests,
        setActiveConversation,
        createNewConversation,
        deleteConversation: deleteConv,
        sendMessage: sendNewMessage,
        uploadFiles: uploadFilesHandler, // 单独的文件上传方法
        interruptConversation: interruptConv,
        regenerateMessage: regenerateMessageHandler, // 新增
        editMessage: editMessageHandler, // 新增
        toggleUserInterest,
        clearUserInterests,
        onCopyMessage: (messageId) => console.log("复制消息:", messageId),
        onFavoriteMessage: (messageId) => console.log("收藏消息:", messageId),
        onLikeMessage: (messageId) => console.log("点赞消息:", messageId),
        // 人工审核相关
        pendingInterrupts,
        activeInterrupt,
        selectInterrupt,
        resolveInterruptFileName,
        submitFeedback: async (feedback, target = null) => {
            const { threadId, fileId } = normalizeInterruptTarget(target);

            if (!threadId) {
                throw new Error("没有待处理的审核中断");
            }
            
            try {
                await chatControl({
                    threadId,
                    action: "resume",
                    feedback,
                    fileId: fileId || null,
                });
                removeInterruptByKey(threadId, fileId || null);
                console.log("反馈已提交，流程将继续");
            } catch (error) {
                console.error("提交反馈失败:", error);
                throw error;
            }
        },
        cancelInterrupt: async (target = null) => {
            const { threadId, fileId } = normalizeInterruptTarget(target);

            if (!threadId) {
                throw new Error("没有待处理的审核中断");
            }
            
            try {
                await chatControl({
                    threadId,
                    action: "cancel",
                    fileId: fileId || null,
                });
                removeInterruptByKey(threadId, fileId || null);
                console.log("已取消审核流程");
            } catch (error) {
                console.error("取消审核失败:", error);
                throw error;
            }
        },
    };

    return (
        <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
    );
};
