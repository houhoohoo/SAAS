// PdfViewer.jsx
import React from "react";
import Button from "../common/Button";
import Icon from "../common/Icon";
import styles from "./PdfViewer.module.css";

const PdfViewer = ({ file, onClose, isOpen }) => {
    if (!isOpen || !file) return null;

    return (
        <div className={styles.pdfViewer}>
            <div className={styles.pdfViewerHeader}>
                <div className={styles.pdfViewerTitle}>
                    <Icon name="FilePdfOutlined" size={20} />
                    <span className={styles.fileName}>{file.name}</span>
                </div>
                <Button
                    variant="secondary"
                    shape="circle"
                    size="small"
                    onClick={onClose}
                    className={styles.closeButton}
                    title="关闭预览">
                    <Icon name="CloseOutlined" size={16} />
                </Button>
            </div>

            <div className={styles.pdfViewerContent}>
                {file.url ? (
                    <iframe
                        src={file.url}
                        title={file.name}
                        className={styles.pdfIframe}
                        width="100%"
                        height="100%"
                    />
                ) : (
                    <div className={styles.pdfPlaceholder}>
                        <Icon name="FilePdfOutlined" size={48} />
                        <p>无法加载PDF文件</p>
                        <p>文件可能已被删除或移动</p>
                    </div>
                )}
            </div>

            <div className={styles.pdfViewerFooter}>
                <Button
                    variant="outline"
                    size="small"
                    onClick={() => window.open(file.url, "_blank")}
                    disabled={!file.url}>
                    <Icon name="ExportOutlined" size={14} />
                    在新窗口打开
                </Button>
                <Button variant="outline" size="small" onClick={onClose}>
                    <Icon name="CloseOutlined" size={14} />
                    关闭
                </Button>
            </div>
        </div>
    );
};

export default PdfViewer;
