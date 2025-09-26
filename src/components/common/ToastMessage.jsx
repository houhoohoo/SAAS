import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import styles from "./ToastMessage.module.css";

const ToastMessage = ({ message, duration = 2000, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            if (onClose) onClose(); // 通知父组件关闭
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!visible) return null;

    return ReactDOM.createPortal(
        <div className={styles.toast}>{message}</div>,
        document.body
    );
};

export default ToastMessage;
