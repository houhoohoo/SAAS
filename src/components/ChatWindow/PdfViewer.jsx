// PdfViewer.jsx
import React, { useEffect, useRef, useState } from "react";
import Button from "../common/Button";
import Icon from "../common/Icon";
import Loader from "../common/Loader";
import styles from "./PdfViewer.module.css";

const PdfViewer = ({ file, onClose, isOpen }) => {
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isCorsFallback, setIsCorsFallback] = useState(false);
    const objectUrlRef = useRef(null);
    const abortControllerRef = useRef(null);

    const cleanupObjectUrl = () => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
    };

    useEffect(() => {
        cleanupObjectUrl();
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        if (!isOpen || !file) {
            setPreviewUrl(null);
            setError("");
            setIsCorsFallback(false);
            setIsLoading(false);
            return () => {};
        }

        if (!file.url) {
            setPreviewUrl(null);
            setError("未提供可预览的文件地址");
            setIsCorsFallback(false);
            setIsLoading(false);
            return () => {};
        }

        if (file.url.startsWith("blob:")) {
            setPreviewUrl(file.url);
            setError("");
            setIsCorsFallback(false);
            setIsLoading(false);
            return () => {};
        }

        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        setError("");
        setIsCorsFallback(false);
        setPreviewUrl(null);

        fetch(file.url, { signal: controller.signal })
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                return response.blob();
            })
            .then((blob) => {
                const objectUrl = URL.createObjectURL(blob);
                objectUrlRef.current = objectUrl;
                setPreviewUrl(objectUrl);
            })
            .catch((err) => {
                if (controller.signal.aborted) {
                    return;
                }
                console.error("PDF 预览加载失败:", err);
                setIsCorsFallback(true);
                setPreviewUrl(file.url);
                setError("无法通过浏览器直接获取文件数据，已尝试使用原始链接进行预览。\n如仍无法显示，请点击下方按钮在新窗口中查看或下载。");
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            });

        return () => {
            controller.abort();
            cleanupObjectUrl();
        };
    }, [file, isOpen]);

    const handleClose = () => {
        cleanupObjectUrl();
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setPreviewUrl(null);
        setError("");
        setIsCorsFallback(false);
        setIsLoading(false);
        onClose?.();
    };

    if (!isOpen || !file) return null;

    const canOpenExternally = Boolean(file.url);
    const displayUrl = previewUrl || null;

    return (
        <div className={styles.pdfViewer}>
            <div className={styles.pdfViewerHeader}>
                <div className={styles.pdfViewerTitle}>
                    <Icon name="FilePdfOutlined" size={20} />
                    <span className={styles.fileName}>{file.name || "PDF 预览"}</span>
                </div>
                <Button
                    variant="secondary"
                    shape="circle"
                    size="small"
                    onClick={handleClose}
                    className={styles.closeButton}
                    title="关闭预览">
                    <Icon name="CloseOutlined" size={16} />
                </Button>
            </div>

            <div className={styles.pdfViewerContent}>
                {isLoading && (
                    <div className={styles.pdfPlaceholder}>
                        <Loader size="medium" />
                        <p>正在加载 PDF...</p>
                    </div>
                )}

                {!isLoading && error && !displayUrl && (
                    <div className={styles.pdfPlaceholder}>
                        <Icon name="WarningOutlined" size={36} />
                        <p>{error}</p>
                    </div>
                )}

                {!isLoading && displayUrl && (
                    <iframe
                        key={`${displayUrl}-${isCorsFallback}`}
                        src={displayUrl}
                        title={file.name || "PDF 预览"}
                        className={styles.pdfIframe}
                        width="100%"
                        height="100%"
                    />
                )}

                {!isLoading && !displayUrl && !error && (
                    <div className={styles.pdfPlaceholder}>
                        <Icon name="FilePdfOutlined" size={48} />
                        <p>暂时无法预览该文件</p>
                    </div>
                )}
            </div>

            <div className={styles.pdfViewerFooter}>
                <Button
                    variant="outline"
                    size="small"
                    onClick={() => canOpenExternally && window.open(file.url, "_blank")}
                    disabled={!canOpenExternally}>
                    <Icon name="ExportOutlined" size={14} />
                    在新窗口打开
                </Button>
                <Button variant="outline" size="small" onClick={handleClose}>
                    <Icon name="CloseOutlined" size={14} />
                    关闭
                </Button>
            </div>
        </div>
    );
};

export default PdfViewer;
