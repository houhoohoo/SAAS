import React, { useState, useRef, useEffect, useCallback } from "react";
import Message from "./Message";
import Button from "../common/Button";
import Loader from "../common/Loader";
import Icon from "../common/Icon";
import styles from "./ChatWindow.module.css";
import PdfViewer from "./PdfViewer";

const MessageFileList = ({ files, formatFileSize, onViewPdf }) => {
    if (!files || files.length === 0) return null;

    return (
        <div className={styles.messageFileList}>
            {files.map((file, index) => (
                <MessageFileItem
                    key={index}
                    file={file}
                    formatFileSize={formatFileSize}
                    onViewPdf={onViewPdf}
                />
            ))}
        </div>
    );
};

const MessageFileItem = ({ file, formatFileSize, onViewPdf }) => {
    const [isHovered, setIsHovered] = useState(false);

    const isPdf = file.type === "application/pdf";

    return (
        <div
            className={styles.messageFileItem}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}>
            <div className={styles.messageFileIcon}>
                <Icon
                    name={isPdf ? "FilePdfOutlined" : "FileOutlined"}
                    size={16}
                />
            </div>
            <div className={styles.messageFileInfo}>
                <div className={styles.messageFileName}>{file.name}</div>
                <div className={styles.messageFileSize}>
                    {formatFileSize(file.size)}
                </div>
            </div>

            {/* PDF预览按钮 - 只在PDF文件上显示，且悬停时显示 */}
            {isPdf && (
                <div
                    className={`${styles.pdfPreviewButton} ${
                        isHovered ? styles.visible : ""
                    }`}>
                    <Button
                        variant="secondary"
                        shape="circle"
                        size="small"
                        onClick={() => onViewPdf(file)}
                        title="预览PDF"
                        className={styles.previewBtn}>
                        <Icon name="EyeOutlined" size={14} />
                    </Button>
                </div>
            )}
        </div>
    );
};

// 文件列表组件（用于输入区域）
const FileList = ({ files, removeFile, formatFileSize, compact = false }) => {
    if (files.length === 0) return null;

    return (
        <div
            className={`${styles.horizontalFileList} ${
                compact ? styles.compact : ""
            }`}>
            {files.map((file, index) => (
                <div key={index} className={styles.fileCard}>
                    <div className={styles.fileCardContent}>
                        <div className={styles.fileIcon}>
                            <Icon name="FileOutlined" size={20} />
                        </div>
                        <div className={styles.fileInfo}>
                            <div className={styles.fileName}>{file.name}</div>
                            <div className={styles.fileSize}>
                                {formatFileSize(file.size)}
                            </div>
                        </div>
                    </div>
                    <button
                        className={styles.removeButton}
                        onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                        }}>
                        <Icon name="CloseOutlined" size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
};

// 空状态组件
const EmptyState = ({
    title = "科研成果评价系统",
    suggestions = [],
    inputValue,
    setInputValue,
    onSendMessage,
    isGenerating,
    onSubmit,
    isTransitioning,
    files,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    isDragging,
    removeFile,
    formatFileSize,
    handleFileSelect,
}) => {
    return (
        <div
            className={`${styles.emptyState} ${
                isTransitioning ? styles.transitioning : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}>
            <h3>{title}</h3>
            <div
                className={`${styles.emptyStateInputArea} ${
                    isTransitioning ? styles.transitioningInput : ""
                }`}>
                <form onSubmit={onSubmit}>
                    <div className={styles.inputContainer}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="请输入..."
                            disabled={isGenerating}
                        />
                        <Button
                            className={styles.inputButton}
                            variant="secondary"
                            shape="circle"
                            size="small"
                            onClick={handleFileSelect}>
                            <Icon name="PlusOutlined" size={20} />
                        </Button>
                        <Button
                            className={styles.inputButton}
                            type="submit"
                            shape="circle"
                            size="small"
                            disabled={!inputValue.trim() || isGenerating}>
                            <Icon name="ArrowUpOutlined" size={20} />
                        </Button>
                    </div>
                </form>
            </div>
            {suggestions.length > 0 && (
                <div className={styles.suggestions}>
                    {suggestions.map((suggestion, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            onClick={() => onSendMessage(suggestion.text)}>
                            {suggestion.text}
                        </Button>
                    ))}
                </div>
            )}

            {/* 文件上传区域 */}
            {files.length == 0 && (
                <div
                    className={`${styles.uploadArea} ${
                        isDragging ? styles.dragging : ""
                    }`}
                    onClick={handleFileSelect}>
                    <p>
                        拖放文件到此处，或<strong>点击选择文件</strong>
                    </p>
                    <p className={styles.hint}>
                        支持 PDF, TXT, DOCX 等文档格式
                    </p>
                </div>
            )}

            {/* 已上传文件列表 */}
            <FileList
                files={files}
                removeFile={removeFile}
                formatFileSize={formatFileSize}
            />
        </div>
    );
};

// 主聊天窗口组件
const ChatWindow = ({
    conversation,
    isGenerating,
    onSendMessage,
    onInterrupt,
    uploadFilesHandler,
    onRegenerate,
    onEditMessage,
    onCopyMessage,
    onFavoriteMessage,
    onLikeMessage,
    isConnected,
}) => {
    const [inputValue, setInputValue] = useState("");
    const [editingMessage, setEditingMessage] = useState(null); // 正在编辑的消息ID
    // eslint-disable-next-line no-unused-vars
    const [editContent, setEditContent] = useState(""); // 编辑内容
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const transitionTimerRef = useRef(null);
    const prevMessagesLength = useRef(0);
    const editInputRef = useRef(null);
    const [viewingPdf, setViewingPdf] = useState(null);
    const [uploadedFilesCache, setUploadedFilesCache] = useState(new Map());

    // 查看PDF文件
    const handleViewPdf = (file) => {
        setViewingPdf(file);
    };

    // 关闭PDF预览
    const handleClosePdf = () => {
        if (viewingPdf?.url?.startsWith("blob:")) {
            URL.revokeObjectURL(viewingPdf.url); // ⭐ 释放 blob URL
        }
        setViewingPdf(null);
    };

    // 清除所有挂起的过渡定时器
    const clearTransitionTimers = useCallback(() => {
        if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
        }
    }, []);

    // 当对话变化时重置状态
    useEffect(() => {
        clearTransitionTimers();
        setIsTransitioning(false);
        setFiles([]);
        setInputValue("");
        setEditingMessage(null);
    }, [conversation, clearTransitionTimers]);

    // 修改提交处理 - 只发送文件ID
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isGenerating) return;

        // 从缓存中获取完整的文件信息
        const filesToSend = Array.from(uploadedFilesCache.values()).filter(
            (cachedFile) =>
                files.some((localFile) => localFile.name === cachedFile.name)
        );

        try {
            // 如果有正在编辑的消息，则发送编辑后的内容
            if (editingMessage) {
                await onEditMessage(editingMessage, inputValue, filesToSend);
                setEditingMessage(null);
                setEditContent("");
            } else {
                // 发送消息（包含已上传的文件信息）
                onSendMessage(inputValue, filesToSend);
            }

            // 发送成功后清理相关文件缓存和本地列表
            filesToSend.forEach((file) => {
                uploadedFilesCache.delete(file.id);
            });
            setFiles([]);
            setInputValue("");
        } catch (err) {
            console.error("发送消息失败:", err);
        }
    };

    // 滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation?.messages]);

    // 监听消息变化，处理过渡动画
    useEffect(() => {
        const currentMessagesLength = conversation?.messages.length || 0;
        const prevLength = prevMessagesLength.current;

        clearTransitionTimers();

        if (prevLength === 0 && currentMessagesLength > 0) {
            setIsTransitioning(true);
            transitionTimerRef.current = setTimeout(() => {
                setIsTransitioning(false);
            }, 500);
        }

        prevMessagesLength.current = currentMessagesLength;

        return () => clearTransitionTimers();
    }, [conversation?.messages, clearTransitionTimers]);

    // 格式化文件大小
    const formatFileSize = useCallback((bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }, []);

    // 移除文件
    const removeFile = useCallback((index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    // 立即上传文件（用户选择文件后调用）
    const handleFileUpload = async (newFiles) => {
        if (!newFiles || newFiles.length === 0) return [];

        setIsUploading(true);
        try {
            const uploadedFiles = await uploadFilesHandler(newFiles);

            // 缓存已上传的文件
            const newCache = new Map(uploadedFilesCache);
            uploadedFiles.forEach((file) => {
                newCache.set(file.id, file);
            });
            setUploadedFilesCache(newCache);

            return uploadedFiles;
        } catch (error) {
            console.error("上传失败:", error);
            throw error;
        } finally {
            setIsUploading(false);
        }
    };
    // 处理文件选择
    const handleFileSelect = useCallback(() => {
        fileInputRef.current.click();
    }, []);

    // 修改文件选择处理
    const handleFileChange = useCallback(
        async (e) => {
            if (e.target.files.length > 0) {
                const newFiles = Array.from(e.target.files);

                try {
                    // 构造完整的文件信息对象
                    const filesWithInfo = newFiles.map((file) => ({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified,
                        // 如果需要，可以添加其他必要属性
                    }));

                    // 立即上传文件（传递完整的文件信息）
                    const uploadedFiles = await handleFileUpload(filesWithInfo);

                    // 上传成功后添加到本地文件列表
                    setFiles((prev) => [
                        ...prev,
                        ...uploadedFiles.map((file) => ({
                            id: file.id, // 使用服务器返回的文件ID
                            name: file.name,
                            size: file.size,
                            type: file.type,
                        })),
                    ]);
                } catch (error) {
                    console.error("文件上传失败:", error);
                }
            }
            e.target.value = "";
        },
        [uploadFilesHandler]
    );

    // 处理拖拽悬停
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    // 处理拖拽离开
    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 修改拖放处理
    const handleDrop = useCallback(
        async (e) => {
            e.preventDefault();
            setIsDragging(false);

            if (e.dataTransfer.files.length > 0) {
                const newFiles = Array.from(e.dataTransfer.files);

                try {
                    // 构造完整的文件信息对象
                    const filesWithInfo = newFiles.map((file) => ({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        lastModified: file.lastModified,
                    }));

                    // 立即上传文件
                    const uploadedFiles = await handleFileUpload(filesWithInfo);
                    setFiles((prev) => [
                        ...prev,
                        ...uploadedFiles.map((file) => ({
                            id: file.id,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                        })),
                    ]);
                } catch (error) {
                    console.error("文件上传失败:", error);
                }
            }
        },
        [uploadFilesHandler]
    );

    // 修改开始编辑逻辑 - 重新关联已上传的文件
    const startEditing = (id, content, existingFiles = []) => {
        setEditingMessage(id);
        setEditContent(content);
        setInputValue(content);

        // 如果原消息有文件，需要重新关联到缓存
        if (existingFiles && existingFiles.length > 0) {
            // 查找缓存中对应的文件
            const cachedFiles = existingFiles.map((file) => {
                const cached = Array.from(uploadedFilesCache.values()).find(
                    (cachedFile) => cachedFile.name === file.name
                );
                return cached || file;
            });

            setFiles(cachedFiles);
        }
    };

    // 取消编辑
    const cancelEditing = () => {
        setEditingMessage(null);
        setEditContent("");
        setInputValue("");
        setFiles([]); // 清空文件列表
    };

    // 建议问题列表
    const suggestions = [
        { text: "如何评价科研成果?" },
        { text: "科研评价标准是什么?" },
        { text: "如何提高科研成果质量?" },
    ];

    return (
        <div className={styles.chatWindow}>
            {/* 使用独立的PdfViewer组件 */}
            <div
                className={`${styles.connectionStatus} ${
                    isConnected ? styles.connected : styles.disconnected
                }`}>
                <Icon
                    name={isConnected ? "WifiOutlined" : "DisconnectOutlined"}
                    size={12}
                />
                <span>{isConnected ? "已连接" : "连接断开"}</span>
            </div>
            <div
                className={`${styles.mainContent} ${
                    viewingPdf ? styles.withPdfViewer : ""
                }`}>
                {conversation && (
                    <div className={styles.header}>
                        <h2>{conversation.title}</h2>
                    </div>
                )}
                <div className={styles.messagesContainer}>
                    {!conversation ? (
                        // 初始状态 - 无任何对话
                        <EmptyState
                            title="科研成果评价系统"
                            suggestions={suggestions}
                            inputValue={inputValue}
                            setInputValue={setInputValue}
                            onSendMessage={onSendMessage}
                            isGenerating={isGenerating}
                            onSubmit={handleSubmit}
                            isTransitioning={isTransitioning}
                            files={files}
                            handleDrop={handleDrop}
                            handleDragOver={handleDragOver}
                            handleDragLeave={handleDragLeave}
                            isDragging={isDragging}
                            removeFile={removeFile}
                            formatFileSize={formatFileSize}
                            handleFileSelect={handleFileSelect}
                        />
                    ) : conversation.messages.length === 0 ? (
                        // 新建对话 - 无消息
                        <EmptyState
                            title="科研成果评价系统"
                            suggestions={suggestions}
                            inputValue={inputValue}
                            setInputValue={setInputValue}
                            onSendMessage={onSendMessage}
                            isGenerating={isGenerating}
                            onSubmit={handleSubmit}
                            isTransitioning={isTransitioning}
                            files={files}
                            handleDrop={handleDrop}
                            handleDragOver={handleDragOver}
                            handleDragLeave={handleDragLeave}
                            isDragging={isDragging}
                            removeFile={removeFile}
                            formatFileSize={formatFileSize}
                            handleFileSelect={handleFileSelect}
                        />
                    ) : (
                        // 有消息的对话
                        <>
                            {conversation.messages.map((msg) => (
                                <div key={msg.id}>
                                    {/* 在消息上方显示文件 */}
                                    {msg.files && msg.files.length > 0 && (
                                        <MessageFileList
                                            files={msg.files}
                                            formatFileSize={formatFileSize}
                                            onViewPdf={handleViewPdf}
                                        />
                                    )}

                                    <Message
                                        message={msg}
                                        onCopy={() => onCopyMessage(msg.id)}
                                        onRegenerate={
                                            msg.sender === "ai"
                                                ? () => onRegenerate(msg.id)
                                                : null
                                        }
                                        onEdit={
                                            msg.sender === "user"
                                                ? () =>
                                                      startEditing(
                                                          msg.id,
                                                          msg.text,
                                                          msg.files
                                                      )
                                                : null
                                        }
                                        onFavorite={
                                            msg.sender === "ai"
                                                ? () =>
                                                      onFavoriteMessage(msg.id)
                                                : null
                                        }
                                        onLike={
                                            msg.sender === "ai"
                                                ? () => onLikeMessage(msg.id)
                                                : null
                                        }
                                        isEditing={editingMessage === msg.id}
                                    />
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </>
                    )}
                </div>

                {/* 隐藏的文件输入框 */}
                <input
                    type="file"
                    accept=".pdf,.txt,.docx"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    style={{ display: "none" }}
                />

                {/* 有消息时底部的输入框 */}
                {conversation && conversation.messages.length > 0 && (
                    <div
                        className={`${styles.inputArea} ${
                            isTransitioning
                                ? styles.transitioningBottomInput
                                : ""
                        }`}>
                        <FileList
                            files={files}
                            removeFile={removeFile}
                            formatFileSize={formatFileSize}
                            compact={true}
                        />

                        {isGenerating && (
                            <div className={styles.generatingIndicator}>
                                <Loader size="small" />
                                <Button
                                    variant="danger-outline"
                                    size="small"
                                    onClick={onInterrupt}>
                                    停止生成
                                </Button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className={styles.inputContainer}>
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) =>
                                        setInputValue(e.target.value)
                                    }
                                    placeholder={
                                        editingMessage
                                            ? "编辑消息..."
                                            : "输入消息..."
                                    }
                                    disabled={isGenerating}
                                    ref={editInputRef}
                                />
                                {editingMessage && (
                                    <Button
                                        className={styles.inputButton}
                                        variant="danger-outline"
                                        shape="circle"
                                        size="small"
                                        onClick={cancelEditing}>
                                        <Icon name="CloseOutlined" size={20} />
                                    </Button>
                                )}
                                <Button
                                    className={styles.inputButton}
                                    variant="secondary"
                                    shape="circle"
                                    size="small"
                                    onClick={handleFileSelect}>
                                    <Icon name="PlusOutlined" size={20} />
                                </Button>
                                <Button
                                    className={styles.inputButton}
                                    type="submit"
                                    shape="circle"
                                    size="small"
                                    disabled={
                                        !inputValue.trim() || isGenerating
                                    }>
                                    <Icon
                                        name={
                                            editingMessage
                                                ? "CheckOutlined"
                                                : "ArrowUpOutlined"
                                        }
                                        size={20}
                                    />
                                </Button>
                            </div>
                        </form>

                        {editingMessage && (
                            <div className={styles.editingHint}>
                                正在编辑消息...
                            </div>
                        )}
                    </div>
                )}

                {/* 上传状态指示器 */}
                {isUploading && (
                    <div className={styles.uploadIndicator}>
                        <Loader size="small" />
                        <span>上传文件中...</span>
                    </div>
                )}
            </div>
            <PdfViewer
                file={viewingPdf}
                onClose={handleClosePdf}
                isOpen={!!viewingPdf}
            />
        </div>
    );
};

export default ChatWindow;
