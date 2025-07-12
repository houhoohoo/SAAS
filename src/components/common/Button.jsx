import React from "react";
import styles from "./Button.module.css";

const Button = ({
    children,
    variant = "primary",
    size = "medium",
    shape = "rounded", // 新增 shape 属性，默认值为 'rounded'
    fullWidth = false,
    disabled = false,
    onClick,
    className = "",
    type = "button",
}) => {
    const buttonClass = `${styles.button} ${styles[variant]} ${styles[size]} ${
        fullWidth ? styles.fullWidth : ""
    } ${styles[shape]} ${className}`; // 添加 shape 类名

    return (
        <button
            type={type}
            className={buttonClass}
            onClick={onClick}
            disabled={disabled}>
            {children}
        </button>
    );
};

export default Button;
