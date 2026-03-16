import React, { useState } from 'react';
import { Button, Modal, Space, Typography, message } from 'antd';
import { CopyOutlined, FullscreenOutlined, CheckOutlined } from '@ant-design/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface CodeBlockProps {
    code: string;
    language?: string;
    filename?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code, language = 'text', filename }) => {
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
                    <Button
                        type="text"
                        size="small"
                        icon={copied ? <CheckOutlined style={{ color: '#52c41a' }} /> : <CopyOutlined />}
                        onClick={handleCopy}
                        style={{ color: '#858585' }}
                    >
                        {copied ? '已复制' : '复制'}
                    </Button>
                    <Button
                        type="text"
                        size="small"
                        icon={<FullscreenOutlined />}
                        onClick={() => setIsModalOpen(true)}
                        style={{ color: '#858585' }}
                    >
                        放大
                    </Button>
                </Space>
            </div>

            {/* 代码块内容 */}
            <SyntaxHighlighter
                language={displayLanguage}
                style={vscDarkPlus}
                customStyle={{
                    margin: 0,
                    borderRadius: '0 0 8px 8px',
                    fontSize: 14,
                    lineHeight: 1.6,
                    maxHeight: 400,
                }}
                showLineNumbers
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
                        >
                            {copied ? '已复制' : '复制'}
                        </Button>
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
                    style={vscDarkPlus}
                    customStyle={{
                        margin: 0,
                        borderRadius: 0,
                        fontSize: 14,
                        lineHeight: 1.6,
                        maxHeight: '70vh',
                    }}
                    showLineNumbers
                >
                    {code}
                </SyntaxHighlighter>
            </Modal>
        </div>
    );
};

export default CodeBlock;
