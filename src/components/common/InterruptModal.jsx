import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import Button from "./Button";
import Icon from "./Icon";
import styles from "./InterruptModal.module.css";

export const InterruptModal = ({
    isOpen,
    onClose,
    interrupts = [],
    activeIndex = 0,
    onSelect,
    resolveFileName,
    onSubmitFeedback,
    onCancel,
    isSubmitting = false,
}) => {
    const [feedback, setFeedback] = useState("");

    const hasInterrupts = Array.isArray(interrupts) && interrupts.length > 0;
    const clampedIndex = hasInterrupts
        ? Math.max(0, Math.min(activeIndex, interrupts.length - 1))
        : 0;
    const interruptData = hasInterrupts ? interrupts[clampedIndex] : null;

    if (!isOpen || !interruptData) return null;

    const handleSubmit = async () => {
        if (!feedback.trim()) return;
        
        try {
            await onSubmitFeedback(
                feedback.trim(),
                {
                    threadId: interruptData.thread_id,
                    fileId: interruptData.file_id || null,
                }
            );
            setFeedback("");
        } catch (error) {
            console.error("提交反馈失败:", error);
        }
    };

    const handleCancel = async () => {
        try {
            await onCancel({
                threadId: interruptData.thread_id,
                fileId: interruptData.file_id || null,
            });
            setFeedback("");
        } catch (error) {
            console.error("取消审核失败:", error);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                className={styles.modal}
                onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>
                        <Icon name="ExclamationCircleOutlined" size={20} />
                        人工审核
                    </h3>
                    <button
                        className={styles.closeButton}
                        onClick={onClose}
                        aria-label="关闭">
                        <Icon name="CloseOutlined" size={20} />
                    </button>
                </div>
                
                <div className={styles.content}>
                    {hasInterrupts && interrupts.length > 1 && (
                        <div className={styles.interruptSwitcher}>
                            <label>待处理文件</label>
                            <div className={styles.interruptTabs}>
                                {interrupts.map((item, index) => {
                                    const fileName = resolveFileName?.(
                                        item.thread_id,
                                        item.file_id
                                    );
                                    return (
                                        <button
                                            key={`${item.thread_id || "global"}-${item.file_id || "all"}-${index}`}
                                            className={`${styles.interruptTab} ${
                                                index === clampedIndex ? styles.activeTab : ""
                                            }`}
                                            onClick={() => onSelect?.(index)}
                                            type="button">
                                            <Icon
                                                name="FilePdfOutlined"
                                                size={14}
                                            />
                                            <span className={styles.tabFileName}>
                                                {fileName || item.file_id || "未命名文件"}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className={styles.promptSection}>
                        <div className={styles.promptText}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm, remarkMath]}
                                rehypePlugins={[rehypeKatex]}>
                                {interruptData.prompt}
                            </ReactMarkdown>
                        </div>
                    </div>

                    {interruptData.payload && (
                        <div className={styles.payloadSection}>
                            <h4>详细信息</h4>
                            <div className={styles.payloadContent}>
                                <table className={styles.payloadTable}>
                                    <tbody>
                                        {Object.entries(interruptData.payload)
                                            .filter(([_, value]) =>
                                                value !== null && value !== undefined && value !== ""
                                            )
                                            .map(([key, value]) => (
                                                <tr key={key}>
                                                    <th>{key}</th>
                                                    <td>
                                                        {typeof value === "string" ? (
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm, remarkMath]}
                                                                rehypePlugins={[rehypeKatex]}
                                                            >
                                                                {value}
                                                            </ReactMarkdown>
                                                        ) : (
                                                            <pre className={styles.jsonPreview}>
                                                                {JSON.stringify(value, null, 2)}
                                                            </pre>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {interruptData.payload?.completeness_issues && (
                        <div className={styles.payloadSection}>
                            <h4>完备性检查</h4>
                            <div className={styles.payloadContent}>
                                <table className={styles.payloadTable}>
                                    <tbody>
                                        <tr>
                                            <th>是否完备</th>
                                            <td>{interruptData.payload.completeness_issues.is_complete ? "是" : "否"}</td>
                                        </tr>
                                        <tr>
                                            <th>整体质量</th>
                                            <td>{interruptData.payload.completeness_issues.overall_quality}</td>
                                        </tr>
                                        <tr>
                                            <th>建议</th>
                                            <td>{interruptData.payload.completeness_issues.recommendation}</td>
                                        </tr>
                                        {interruptData.payload.completeness_issues.reason && (
                                            <tr>
                                                <th>原因说明</th>
                                                <td>
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm, remarkMath]}
                                                        rehypePlugins={[rehypeKatex]}
                                                    >
                                                        {interruptData.payload.completeness_issues.reason}
                                                    </ReactMarkdown>
                                                </td>
                                            </tr>
                                        )}
                                        {Array.isArray(interruptData.payload.completeness_issues.missing_parts) &&
                                            interruptData.payload.completeness_issues.missing_parts.length > 0 && (
                                                <tr>
                                                    <th>缺失要点</th>
                                                    <td>
                                                        <ul className={styles.missingList}>
                                                            {interruptData.payload.completeness_issues.missing_parts.map(
                                                                (item, index) => (
                                                                    <li key={index}>{item}</li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </td>
                                                </tr>
                                            )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className={styles.feedbackSection}>
                        <label htmlFor="feedback" className={styles.feedbackLabel}>
                            请提供您的反馈意见：
                        </label>
                        <textarea
                            id="feedback"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="请输入您的反馈意见..."
                            className={styles.feedbackTextarea}
                            rows={4}
                            autoFocus
                        />
                    </div>
                </div>

                <div className={styles.actions}>
                    <Button
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}>
                        取消流程
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!feedback.trim() || isSubmitting}
                        loading={isSubmitting}>
                        提交反馈
                    </Button>
                </div>
            </div>
        </div>
    );
};
