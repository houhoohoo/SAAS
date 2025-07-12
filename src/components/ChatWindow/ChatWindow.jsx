import React, { useState, useRef, useEffect, useCallback } from "react";
import Message from "./Message";
import Button from "../common/Button";
import Loader from "../common/Loader";
import Icon from "../common/Icon";
import styles from "./ChatWindow.module.css";

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
    files, //上传的文件列表
    handleDrop, //处理文件拖放
    handleDragOver, //处理拖拽悬停
    handleDragLeave, //处理拖拽离开
    isDragging, //是否正在拖拽
    removeFile, //移除文件
    formatFileSize, //格式化文件大小
    handleFileSelect, //处理文件选择
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
            {files.length > 0 && (
                <div className={styles.fileList}>
                    <ul>
                        {files.map((file, index) => (
                            <li key={index}>
                                <div className={styles.fileInfo}>
                                    <div className={styles.fileIcon}>
                                        <Icon name="FileOutlined" size={20} />
                                    </div>
                                    <div className={styles.fileName}>
                                        {file.name}
                                    </div>
                                    <div className={styles.fileSize}>
                                        {formatFileSize(file.size)}
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
                            </li>
                        ))}
                    </ul>
                </div>
            )}
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
}) => {
    const [inputValue, setInputValue] = useState("");
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const transitionTimerRef = useRef(null); // 使用ref管理定时器
    const prevMessagesLength = useRef(0);

    // 清除所有挂起的过渡定时器
    const clearTransitionTimers = useCallback(() => {
        if (transitionTimerRef.current) {
            clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
        }
    }, []);

    // 当对话变化时重置状态
    useEffect(() => {
        // 立即清除所有挂起的动画
        clearTransitionTimers();

        // 重置过渡状态
        setIsTransitioning(false);

        // 重置文件列表和输入
        setFiles([]);
        setInputValue("");
    }, [conversation, clearTransitionTimers]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isGenerating) return;

        onSendMessage(inputValue);
        setInputValue("");
    };

    // 滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [conversation?.messages]);

    // 监听消息变化，处理过渡动画
    useEffect(() => {
        const currentMessagesLength = conversation?.messages.length || 0;
        const prevLength = prevMessagesLength.current;

        // 清除之前的定时器
        clearTransitionTimers();

        if (prevLength === 0 && currentMessagesLength > 0) {
            setIsTransitioning(true);

            // 设置新定时器（保持500ms动画时间）
            transitionTimerRef.current = setTimeout(() => {
                setIsTransitioning(false);
            }, 500);
        }

        prevMessagesLength.current = currentMessagesLength;

        // 组件卸载时清理
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

    // 处理文件选择
    const handleFileSelect = useCallback(() => {
        fileInputRef.current.click();
    }, []);

    // 处理文件输入变化
    const handleFileChange = useCallback((e) => {
        if (e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...newFiles]);
            uploadFiles(newFiles); // 自动上传
        }
    }, []);

    // 处理拖拽悬停
    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    // 处理拖拽离开
    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    // 处理文件拖放
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            setFiles((prev) => [...prev, ...newFiles]);
            uploadFiles(newFiles); // 自动上传
        }
    }, []);

    // 上传文件
    const uploadFiles = useCallback(
        async (filesToUpload) => {
            if (!filesToUpload || filesToUpload.length === 0) return;

            setIsUploading(true);
            try {
                // 调用上传API
                const uploadedFiles = await uploadFilesHandler(filesToUpload);

                // 更新文件状态（这里可以添加成功状态标记）
                console.log("文件上传成功:", uploadedFiles);

                // 如果需要，可以显示上传成功提示
            } catch (error) {
                console.error("上传失败:", error);
                // 处理上传失败情况
            } finally {
                setIsUploading(false);
            }
        },
        [uploadFilesHandler]
    );

    // 建议问题列表
    const suggestions = [
        { text: "如何评价科研成果?" },
        { text: "科研评价标准是什么?" },
        { text: "如何提高科研成果质量?" },
    ];

    return (
        <div className={styles.chatWindow}>
            {/* 标题栏 - 只在有对话时显示 */}
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
                        description="开始一个新的对话或从侧边栏选择已有对话"
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
                        description="你可以问我任何关于科研成果评价的问题"
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
                            <Message key={msg.id} message={msg} />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* 隐藏的文件输入框 */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                style={{ display: "none" }}
            />

            {/* 有消息时底部的输入框 */}
            {conversation && conversation.messages.length > 0 && (
                <div
                    className={`${styles.inputArea} ${
                        isTransitioning ? styles.transitioningBottomInput : ""
                    }`}>
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
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="输入消息..."
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
            )}

            {/* 上传状态指示器 */}
            {isUploading && (
                <div className={styles.uploadIndicator}>
                    <Loader size="small" />
                    <span>上传文件中...</span>
                </div>
            )}
        </div>
    );
};

export default ChatWindow;
