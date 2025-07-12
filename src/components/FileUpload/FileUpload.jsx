import React, { useRef, useState } from 'react';
import Button from '../common/Button';
import Icon from '../common/Icon';
import Loader from '../common/Loader';
import styles from './FileUpload.module.css';

const FileUpload = ({ onClose, onUpload }) => {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files.length > 0) {
            const newFiles = Array.from(e.dataTransfer.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            await onUpload(files);
        } catch (error) {
            console.error('上传失败:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className={styles.modal}>
            <div className={styles.content}>
                <div className={styles.header}>
                    <h3>上传文件</h3>
                    <button className={styles.closeButton} onClick={onClose}>
                        <Icon name="CloseOutlined" size={20} />
                    </button>
                </div>

                <div
                    className={`${styles.dropArea} ${isDragging ? styles.dragging : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current.click()}
                >
                    <Icon name="UploadOutlined" size={48} />
                    <p>拖放文件到此处，或<strong>点击选择文件</strong></p>
                    <p className={styles.hint}>支持 PDF, TXT, DOCX 等文档格式</p>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    style={{ display: 'none' }}
                />

                {files.length > 0 && (
                    <div className={styles.fileList}>
                        <h4>已选文件 ({files.length})</h4>
                        <ul>
                            {files.map((file, index) => (
                                <li key={index}>
                                    <div className={styles.fileInfo}>
                                        <div className={styles.fileIcon}>
                                            <Icon name="FileOutlined" size={20} />
                                        </div>
                                        <div className={styles.fileName}>{file.name}</div>
                                        <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                                    </div>
                                    <button
                                        className={styles.removeButton}
                                        onClick={() => removeFile(index)}
                                    >
                                        <Icon name="CloseOutlined" size={14} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className={styles.actions}>
                    <Button variant="secondary" onClick={onClose}>取消</Button>
                    <Button
                        variant="primary"
                        onClick={handleUpload}
                        disabled={files.length === 0 || isUploading}
                    >
                        {isUploading ? <><Loader size="small" /> 上传中...</> : '上传文件'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;