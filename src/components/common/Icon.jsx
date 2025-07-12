/* eslint-disable react-refresh/only-export-components */
import React from "react";
import * as AntIcons from "@ant-design/icons";
// import PropTypes from "prop-types";

// 自定义图标缓存
const customIcons = {};

/**
 * 注册自定义 SVG 图标
 * @param {Object} icons - 图标对象，键为图标名，值为 SVG 组件
 */
export const registerCustomIcons = (icons) => {
    Object.keys(icons).forEach((key) => {
        customIcons[key] = icons[key];
    });
};

const Icon = ({
    name,
    size = 16,
    spin,
    rotate,
    style = {},
    className,
    ...props
}) => {
    // 首先检查是否是自定义图标
    const CustomIcon = customIcons[name];
    if (CustomIcon) {
        return (
            <CustomIcon
                style={{ fontSize: size, ...style }}
                className={className}
                {...props}
            />
        );
    }

    // 然后检查是否是 Ant Design 图标
    const AntIcon = AntIcons[name];
    if (AntIcon) {
        return (
            <AntIcon
                style={{ fontSize: size, ...style }}
                className={className}
                spin={spin}
                rotate={rotate}
                {...props}
            />
        );
    }

    console.warn(`Icon "${name}" not found`);
    return null;
};

// Icon.propTypes = {
//     name: PropTypes.string.isRequired,
//     size: PropTypes.number,
//     spin: PropTypes.bool,
//     rotate: PropTypes.number,
//     style: PropTypes.object,
//     className: PropTypes.string,
// };

export default Icon;
