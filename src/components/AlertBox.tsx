import React from 'react';
import { Alert } from 'antd';
import type { ComponentProps } from '../core/Renderer';

export interface AlertBoxProps extends ComponentProps {
    type?: 'success' | 'info' | 'warning' | 'error';
    message?: string;
    description?: string;
    showIcon?: boolean;
    closable?: boolean;
}

/**
 * AlertBox - 警告提示框组件
 * 
 * 功能：在 Markdown 中渲染 Ant Design 风格的警告框
 * 
 * 使用方式：
 * :::success
 * 这是成功提示
 * :::
 * 
 * @example
 * <AlertBox type="success" message="操作成功" />
 */
export const AlertBox: React.FC<AlertBoxProps> = ({
    type = 'info',
    message,
    description,
    showIcon = true,
    closable = false,
    children,
}) => {
    // 如果没有 message，使用 children 作为内容
    const content = message || (typeof children === 'string' ? children : '');

    return (
        <Alert
            type={type}
            message={content}
            description={description}
            showIcon={showIcon}
            closable={closable}
            style={{ marginBottom: 16, marginTop: 16 }}
        />
    );
};

export default AlertBox;
