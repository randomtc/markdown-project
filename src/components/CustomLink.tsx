import React from 'react';
import { LinkOutlined } from '@ant-design/icons';
import type { ComponentProps } from '../core/Renderer';

export interface CustomLinkProps extends ComponentProps {
    href?: string;
    target?: string;
    rel?: string;
    /** 链接颜色 */
    color?: string;
    /** 是否加粗 */
    bold?: boolean;
    /** 是否斜体 */
    italic?: boolean;
    /** 是否显示图标 */
    showIcon?: boolean;
    /** 自定义图标 */
    icon?: React.ReactNode;
    /** 下划线样式 */
    underline?: 'none' | 'hover' | 'always';
}

/**
 * CustomLink - 可自定义样式的链接组件
 * 
 * 功能：支持颜色、加粗、斜体、图标等自定义样式
 */
export const CustomLink: React.FC<CustomLinkProps> = ({
    href = '#',
    target,
    rel,
    color = '#1890ff',
    bold = false,
    italic = false,
    showIcon = false,
    icon,
    underline = 'hover',
    children,
}) => {
    const style: React.CSSProperties = {
        color,
        fontWeight: bold ? 'bold' : 'normal',
        fontStyle: italic ? 'italic' : 'normal',
        textDecoration: underline === 'always' ? 'underline' : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (underline === 'hover') {
            e.currentTarget.style.textDecoration = 'underline';
        }
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (underline === 'hover') {
            e.currentTarget.style.textDecoration = 'none';
        }
    };

    return (
        <a
            href={href}
            target={target}
            rel={rel}
            style={style}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {showIcon && (icon || <LinkOutlined />)}
            {children}
        </a>
    );
};

export default CustomLink;
