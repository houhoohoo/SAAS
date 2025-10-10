import React from "react";
import Icon from "../common/Icon";
import styles from "./MultiFileProgress.module.css";

const MultiFileProgress = ({ fileProgress = {}, uploadedFiles = [] }) => {
    if (!fileProgress || Object.keys(fileProgress).length === 0) {
        return null;
    }

    // 仅保留未完成的文件状态（处理中或等待中）
    const activeProgress = Object.entries(fileProgress).filter(([, progress]) =>
        progress?.status === "waiting" || progress?.status === "processing"
    );

    if (activeProgress.length === 0) {
        return null;
    }

    const getStatusIcon = (status) => {
        switch (status) {
            case "processing":
                return <Icon name="LoadingOutlined" size={14} className={styles.spinning} />;
            case "completed":
            case "done":
                return <Icon name="CheckCircleOutlined" size={14} className={styles.success} />;
            case "error":
                return <Icon name="CloseCircleOutlined" size={14} className={styles.error} />;
            default:
                return <Icon name="ClockCircleOutlined" size={14} className={styles.pending} />;
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "processing":
                return "处理中";
            case "completed":
                return "已完成";
            case "done":
                return "完成";
            case "error":
                return "失败";
            default:
                return "等待中";
        }
    };

    const getFileName = (fileId) => {
        const file = uploadedFiles.find(f => f.id === fileId);
        if (file) {
            return file.name;
        }
        
        // 如果找不到文件，尝试从fileId中提取文件名
        if (fileId && typeof fileId === 'string') {
            // 如果是完整路径，提取文件名
            if (fileId.includes('/')) {
                const fileName = fileId.split('/').pop();
                return fileName || `文件 ${fileId}`;
            }
            // 如果是文件ID，返回简化显示
            return `文件 ${fileId.substring(0, 8)}...`;
        }
        
        return `文件 ${fileId}`;
    };

    return (
        <div className={styles.multiFileProgress}>
            <div className={styles.progressHeader}>
                <Icon name="FileTextOutlined" size={16} />
                <span>多文件分析进度</span>
            </div>
            <div className={styles.progressList}>
                {activeProgress.map(([fileId, progress]) => (
                    <div key={fileId} className={styles.progressItem}>
                        <div className={styles.progressInfo}>
                            <div className={styles.fileName}>
                                {getFileName(fileId)}
                            </div>
                            <div className={styles.progressStatus}>
                                {getStatusIcon(progress.status)}
                                <span className={`${styles.statusText} ${styles[progress.status]}`}>
                                    {getStatusText(progress.status)}
                                </span>
                            </div>
                        </div>
                        <div className={styles.progressBar}>
                            <div
                                className={styles.progressFill}
                                style={{ width: `${progress.progress || 0}%` }}
                            />
                        </div>
                        {progress.status === "error" && progress.error && (
                            <div className={styles.errorMessage}>
                                {progress.error}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MultiFileProgress;
