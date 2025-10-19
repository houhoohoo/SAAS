import React, { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import Button from "../common/Button";
import Icon from "../common/Icon";
import ToastMessage from "../common/ToastMessage";
import ChartBlock from "./ChartBlock";
import styles from "./ChatWindow.module.css";

const Message = ({
    message,
    onRegenerate,
    onEdit,
    onFavorite,
    onLike,
    isEditing,
    formatFileSize,
}) => {
    const isAI = message.sender === "ai";
    const timestamp = new Date(message.timestamp);
    const isError = Boolean(message.isError);

    const messageClassName = `${styles.message} ${
        isAI ? styles.aiMessage : styles.userMessage
    } ${isEditing ? styles.editingMessage : ""} ${isError ? styles.errorMessage : ""}`;

    const aiAttachments =
        isAI && Array.isArray(message.files)
            ? message.files.filter((file) => {
                  const fileName = file?.name || "";
                  const fileId = file?.id || "";
                  const hasUrl = file?.url && file.url.trim() !== "";

                  return (
                      hasUrl &&
                      (fileName.includes("报告") ||
                          fileName.includes("Report") ||
                          fileName.includes("report") ||
                          fileId.includes("report") ||
                          fileId.includes("Report"))
                  );
              })
            : [];

    const [showToast, setShowToast] = useState(false);

    const contentSegments = useMemo(() => {
        const rawText = message.text || "";
        const segments = [];

        if (!rawText) {
            return segments;
        }

        const pushMarkdownSegment = (textSegment) => {
            if (!textSegment) return;
            segments.push({ type: "markdown", content: textSegment });
        };

        let cursor = 0;

        while (cursor < rawText.length) {
            const fenceStart = rawText.indexOf("```", cursor);

            if (fenceStart === -1) {
                pushMarkdownSegment(rawText.slice(cursor));
                break;
            }

            if (fenceStart > cursor) {
                pushMarkdownSegment(rawText.slice(cursor, fenceStart));
            }

            const infoStart = fenceStart + 3;
            const infoEnd = rawText.indexOf("\n", infoStart);

            if (infoEnd === -1) {
                segments.push({ type: "chart_pending" });
                break;
            }

            const infoString = rawText.slice(infoStart, infoEnd).trim();
            const closingIndex = rawText.indexOf("```", infoEnd + 1);

            if (closingIndex === -1) {
                segments.push({ type: "chart_pending" });
                break;
            }

            const jsonStr = rawText.slice(infoEnd + 1, closingIndex).trim();
            const infoLower = infoString.toLowerCase();

            if (infoLower.startsWith("json") && infoLower.includes("chart")) {
                try {
                    const parsed = JSON.parse(jsonStr);
                    segments.push({ type: "chart", data: parsed, raw: jsonStr });
                } catch (error) {
                    segments.push({ type: "chart_error", raw: jsonStr, error });
                }
            } else {
                pushMarkdownSegment(rawText.slice(fenceStart, closingIndex + 3));
            }

            cursor = closingIndex + 3;

            if (rawText[cursor] === "\r") {
                cursor += 1;
            }
            if (rawText[cursor] === "\n") {
                cursor += 1;
            }
        }

        return segments;
    }, [message.text]);

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
                className={messageClassName}>
                <div className={styles.content}>
                    <div className={`${styles.text} ${isAI ? styles.aiText : ""}`}>
                        {isError ? (
                            <div className={styles.errorText}>{message.text}</div>
                        ) : isAI ? (
                            <div className={styles.markdownContent}>
                                {contentSegments.length === 0 ? (
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {message.text || ""}
                                    </ReactMarkdown>
                                ) : (
                                    contentSegments.map((segment, index) => {
                                        if (segment.type === "markdown") {
                                            return (
                                                <ReactMarkdown
                                                    key={`markdown-${index}`}
                                                    remarkPlugins={[remarkGfm, remarkMath]}
                                                    rehypePlugins={[rehypeKatex]}
                                                >
                                                    {segment.content}
                                                </ReactMarkdown>
                                            );
                                        }

                                        if (segment.type === "chart") {
                                            return (
                                                <ChartBlock
                                                    key={`chart-${index}`}
                                                    data={segment.data}
                                                    rawJson={segment.raw}
                                                />
                                            );
                                        }

                                        if (segment.type === "chart_pending") {
                                            return (
                                                <div
                                                    key={`chart-pending-${index}`}
                                                    className={styles.chartPlaceholder}
                                                >
                                                    图表生成中...
                                                </div>
                                            );
                                        }

                                        if (segment.type === "chart_error") {
                                            return (
                                                <div
                                                    key={`chart-error-${index}`}
                                                    className={styles.chartError}
                                                >
                                                    无法解析图表数据
                                                </div>
                                            );
                                        }

                                        return null;
                                    })
                                )}
                            </div>
                        ) : (
                            message.text
                        )}
                    </div>
                    {!isError && aiAttachments.length > 0 && (
                        <div className={styles.aiAttachments}>
                            <div className={styles.aiAttachmentsHeader}>
                                <Icon name="PaperClipOutlined" size={14} />
                                <span>报告附件</span>
                            </div>
                            <div className={styles.aiAttachmentButtons}>
                                {aiAttachments.map((file, index) => (
                                    <Button
                                        key={`${file.id || file.url || file.name || index}`}
                                        variant="outline"
                                        size="small"
                                        onClick={() => {
                                            if (!file?.url) return;
                                            if (typeof window !== "undefined") {
                                                window.open(
                                                    file.url,
                                                    "_blank",
                                                    "noopener,noreferrer"
                                                );
                                            }
                                        }}
                                        disabled={!file?.url}
                                        className={styles.attachmentButton}>
                                        <span className={styles.attachmentButtonContent}>
                                            <Icon
                                                name={
                                                    file?.type === "application/pdf" ||
                                                    file?.name?.toLowerCase().endsWith(".pdf")
                                                        ? "FilePdfOutlined"
                                                        : "FileOutlined"
                                                }
                                                size={14}
                                            />
                                            <span className={styles.attachmentName}>
                                                {file?.name || `附件 ${index + 1}`}
                                            </span>
                                            {file?.size && formatFileSize && (
                                                <span className={styles.attachmentSize}>
                                                    {formatFileSize(file.size)}
                                                </span>
                                            )}
                                        </span>
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
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
