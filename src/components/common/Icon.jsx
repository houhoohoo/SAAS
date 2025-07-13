// src/components/common/Icon.jsx
import React from 'react';
import * as AntIcons from '@ant-design/icons';

// 本地图标注册表
const localIcons = {
    // 这里可以添加您的本地SVG图标
    // 示例：
    // 'logo': () => (
    //   <svg viewBox="0 0 24 24" fill="currentColor">
    //     <path d="..."/>
    //   </svg>
    // )
};

const Icon = ({
    name,
    size = 16,
    color,
    className = '',
    style = {},
    ...props
}) => {
    // 首先检查是否是本地图标
    const LocalIcon = localIcons[name];
    if (LocalIcon) {
        return (
            <span
                className={`anticon ${className}`}
                style={{
                    fontSize: size,
                    color,
                    ...style
                }}
                {...props}
            >
                <LocalIcon />
            </span>
        );
    }

    // 检查是否是Ant Design图标
    const AntIcon = AntIcons[name];
    if (AntIcon) {
        return (
            <AntIcon
                style={{
                    fontSize: size,
                    color,
                    ...style
                }}
                className={className}
                {...props}
            />
        );
    }

    console.warn(`Icon "${name}" not found`);
    return null;
};

export default Icon;