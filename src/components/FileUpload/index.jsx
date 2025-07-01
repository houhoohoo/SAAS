import React, { useState } from 'react';
import FileUpload from './FileUpload';
import { useChat } from '../../contexts/ChatContext';

const FileUploadContainer = ({ onClose }) => {
    const { uploadFiles } = useChat();

    const handleUpload = async (files) => {
        const uploadedFiles = await uploadFiles(files);
        if (uploadedFiles.length > 0) {
            onClose();
        }
    };

    return <FileUpload onClose={onClose} onUpload={handleUpload} />;
};

export default FileUploadContainer;