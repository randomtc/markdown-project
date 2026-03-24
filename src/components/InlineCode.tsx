import React from 'react';
import type { ComponentProps } from '../core/Renderer';

export interface InlineCodeProps extends ComponentProps {
    children?: React.ReactNode;
    /** 背景色 */
    bgColor?: string;
    /** 文字颜色 */
    color?: string;
    /** 边框颜色 */
    borderColor?: string;
    /** 圆角 */
    borderRadius?: number;
    /** 内边距 */
    padding?: string;
    /** 字体大小 */
    fontSize?: number;
}

export const InlineCode: React.FC<InlineCodeProps> = ({
    children,
    bgColor = '#f5f5f5',
    color = '#d63384',
    borderColor = '#e8e8e8',
    borderRadius = 4,
    padding = '2px 6px',
    fontSize = 14,
}) => {
    const style: React.CSSProperties = {
        background: bgColor,
        color: color,
        padding: padding,
        borderRadius: borderRadius,
        fontSize: fontSize,
        fontFamily: 'Consolas, Monaco, "Andale Mono", monospace',
        border: `1px solid ${borderColor}`,
    };

    return <code style={style}>{children}</code>;
};

export default InlineCode;
