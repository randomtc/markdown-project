import React, { useState } from 'react';
import { Button, Modal, Space, Typography, message } from 'antd';
import { CopyOutlined, FullscreenOutlined, CheckOutlined } from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight, oneDark, vs, dracula, atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ComponentProps } from '../core/Renderer';

// 主题映射表
const themeMap = {
    vscDarkPlus,
    oneLight,
    oneDark,
    vs,
    dracula,
    atomDark,
};

export type CodeTheme = keyof typeof themeMap;

export interface CodeBlockProps extends ComponentProps {
    code: string;
    language?: string;
    filename?: string;
    theme?: CodeTheme;
    showLineNumbers?: boolean;
    showCopy?: boolean;
    showFullscreen?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
    code,
    language = 'text',
    filename,
    theme = 'vscDarkPlus',
    showLineNumbers = true,
    showCopy = true,
    showFullscreen = true,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            message.success('代码已复制');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            message.error('复制失败');
        }
    };

    const displayLanguage = language === 'text' || !language ? 'plaintext' : language;
    const selectedTheme = themeMap[theme] || vscDarkPlus;

    return (
        <div style={{ position: 'relative', margin: '16px 0' }}>
            {/* 代码块头部 */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 16px',
                    background: '#1e1e1e',
                    borderRadius: '8px 8px 0 0',
                    borderBottom: '1px solid #333',
                }}
            >
                <Space>
                    <Typography.Text style={{ color: '#858585', fontSize: 12 }}>
                        {filename || displayLanguage}
                    </Typography.Text>
                </Space>
                <Space>
                    {showFullscreen && (
                        <Button
                            type="text"
                            size="small"
                            icon={<FullscreenOutlined />}
                            onClick={() => setIsModalOpen(true)}
                            style={{ color: '#858585' }}
                        />
                    )}
                    {showCopy && (
                        <Button
                            type="text"
                            size="small"
                            icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                            onClick={handleCopy}
                            style={{ color: '#858585' }}
                        />
                    )}
                </Space>
            </div>

            {/* 代码块内容 */}
            <SyntaxHighlighter
                language={displayLanguage}
                style={selectedTheme}
                customStyle={{
                    margin: 0,
                    borderRadius: '0 0 8px 8px',
                    fontSize: 14,
                    lineHeight: 1.6,
                    maxHeight: 400,
                }}
                showLineNumbers={showLineNumbers}
            >
                {code}
            </SyntaxHighlighter>

            {/* 放大 Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                            <Typography.Text strong>{filename || displayLanguage}</Typography.Text>
                        </Space>
                        <Button
                            style={{ marginRight: 10 }}
                            type="text"
                            size="small"
                            icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                            onClick={handleCopy}
                        />

                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={900}
                bodyStyle={{ padding: 0 }}
            >
                <SyntaxHighlighter
                    language={displayLanguage}
                    style={selectedTheme}
                    customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: 14,
                        lineHeight: 1.6,
                        maxHeight: '70vh',
                    }}
                    showLineNumbers={showLineNumbers}
                >
                    {code}
                </SyntaxHighlighter>
            </Modal>
        </div>
    );
};

export default CodeBlock;
