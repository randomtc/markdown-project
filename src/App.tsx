import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertBox } from "./components/AlertBox";
import { Markdown } from "./components/Markdown";
import { SkeletonImage } from "./components/SkeletonImage";
import { CustomLink } from "./components/CustomLink";
import { CodeBlock, type CodeTheme } from "./components/CodeBlock";
import { InlineCode } from "./components/InlineCode";
import "./App.css";
import { Button, Card, Flex, Segmented, InputNumber, Space, Switch, Input, Radio, Checkbox, ColorPicker, Typography } from "antd";
import { demos } from "./mockData";



const App: React.FC = () => {

    const [streamingContent, setStreamingContent] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);



    const [renderMarkdown, setRenderMarkdown] = useState(demos[0].content);
    const [currentDemo, setCurrentDemo] = useState<string>('总览');
    const hasInitialized = useRef(false);

    // 是否启用自定义组件
    const [enableCustomComponents, setEnableCustomComponents] = useState<boolean>(true);

    // 总览页面各配置开关（默认只打开 Link 和 Image）
    const [configSwitches, setConfigSwitches] = useState({
        Link: true,
        Image: false,
        CodeBlock: false,
        InlineCode: false,
    });

    // Image 配置（输入暂存值 & 实际渲染值）
    const [imageConfigInput, setImageConfigInput] = useState({
        width: 100,
        height: 100,
        preview: true,
        loadingType: 'skeleton' as 'skeleton' | 'custom',
        loadingText: '加载中...',
    });
    const [imageConfig, setImageConfig] = useState({
        width: 100,
        height: 100,
        preview: true,
        loadingType: 'skeleton' as 'skeleton' | 'custom',
        loadingText: '加载中...',
    });

    // CodeBlock 配置
    const [codeBlockConfig, setCodeBlockConfig] = useState({
        theme: 'vscDarkPlus' as CodeTheme,
        showLineNumbers: true,
        showCopy: true,
        showFullscreen: true,
    });

    // InlineCode 配置
    const [inlineCodeConfig, setInlineCodeConfig] = useState({
        bgColor: '#f5f5f5',
        color: '#d63384',
    });

    // Link 配置（实时生效）
    const [linkConfig, setLinkConfig] = useState({
        color: '#1890ff',
        bold: false,
        italic: false,
        showIcon: false,
        underline: false,
        placeholderType: 'skeleton' as 'skeleton' | 'custom',
        placeholderText: '链接加载中...',
    });

    // 根据开关选择组件映射
    const components = enableCustomComponents ? {
        alert: AlertBox,

        "incomplete-image": (props: any) => (
            <SkeletonImage
                {...props}
                width={imageConfig.width}
                height={imageConfig.height}
                preview={imageConfig.preview}
                loading={imageConfig.loadingType === 'custom' ? <div style={{ width: imageConfig.width, height: imageConfig.height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', borderRadius: 4 }}>{imageConfig.loadingText}</div> : undefined}
            />
        ),
        img: (props: any) => (
            <SkeletonImage
                {...props}
                width={imageConfig.width}
                height={imageConfig.height}
                preview={imageConfig.preview}
                loading={imageConfig.loadingType === 'custom' ? <div style={{ width: imageConfig.width, height: imageConfig.height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', borderRadius: 4 }}>{imageConfig.loadingText}</div> : undefined}
            />
        ),
        code: (props: any) => {
            const isBlock = props['data-block'] === 'true';
            // 行内代码
            if (!isBlock) {
                return (
                    <InlineCode
                        {...props}
                        bgColor={inlineCodeConfig.bgColor}
                        color={inlineCodeConfig.color}
                    />
                );
            }
            // 代码块
            const lang = props['data-lang'] || props.className?.replace('language-', '') || 'text';
            return (
                <CodeBlock
                    {...props}
                    code={props.children}
                    language={lang}
                    theme={codeBlockConfig.theme}
                    showLineNumbers={codeBlockConfig.showLineNumbers}
                    showCopy={codeBlockConfig.showCopy}
                    showFullscreen={codeBlockConfig.showFullscreen}
                />
            );
        },
        "incomplete-link": () => (
            <span style={{ color: '#999', fontStyle: 'italic' }}>[{linkConfig.placeholderText}]</span>
        ),
        a: (props: any) => (
            <CustomLink
                {...props}
                href={props.href}
                target={props.target}
                rel={props.rel}
                color={linkConfig.color}
                bold={linkConfig.bold}
                italic={linkConfig.italic}
                showIcon={linkConfig.showIcon}
                underline={linkConfig.underline ? 'always' : 'hover'}
            />
        ),
    } : {};

    // enableCache 始终为 true，确保流式缓存正常工作

    /** 清除流式定时器 */
    const clearStreamingInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    /** 开始流式演示（模拟 AI 逐字输出） */
    const startStreaming = useCallback((renderMarkdown: string) => {
        // 清除之前的定时器
        clearStreamingInterval();
        // 先清空内容，确保缓存重置
        setStreamingContent("");
        // 使用 setTimeout 确保清空后再开始新的流式输出
        setTimeout(() => {
            setIsStreaming(true);
            const chars = renderMarkdown.split("");
            let index = 0;

            intervalRef.current = setInterval(() => {
                if (index < chars.length) {
                    const chunkSize = Math.floor(Math.random() * 3) + 1;
                    const chunk = chars.slice(index, index + chunkSize).join("");
                    index += chunkSize;
                    setStreamingContent((prev) => prev + chunk);
                } else {
                    clearStreamingInterval();
                    setIsStreaming(false);
                }
            }, 30);
        }, 50);
    }, [clearStreamingInterval]);

    useEffect(() => {
        if (!hasInitialized.current) {
            hasInitialized.current = true;
            startStreaming(renderMarkdown);
        }
        return () => {
            clearStreamingInterval();
        };
    }, []);


    return (
        <div className="app">
            <Card style={{ width: '80vw', margin: '0 auto' }}>
                <Flex vertical gap="middle">
                    {/* Demo 选择区 */}
                    <Segmented
                        options={demos.map((demo) => demo.title)}
                        onChange={(value) => {
                            // 清除之前的流式输出
                            clearStreamingInterval();
                            setStreamingContent('');
                            setIsStreaming(false);
                            const myRenderMarkdown = demos.find((demo) => demo.title === value)?.content || '';
                            setCurrentDemo(value as string);
                            setRenderMarkdown(myRenderMarkdown);
                            startStreaming(myRenderMarkdown);
                        }}
                        block
                    />

                    <Card
                        size="small"
                        title={
                            <Space>
                                <Typography.Text strong>组件配置</Typography.Text>
                                <Switch
                                    size="small"
                                    checked={enableCustomComponents}
                                    onChange={setEnableCustomComponents}
                                    checkedChildren="开启"
                                    unCheckedChildren="关闭"
                                />
                            </Space>
                        }
                    >
                        {enableCustomComponents ? (
                            <Flex vertical gap="middle">
                                {/* 总览页面显示配置开关 */}
                                {currentDemo === '总览' && (

                                    <Space wrap>
                                        <Switch
                                            size="small"
                                            checked={configSwitches.Link}
                                            onChange={(checked) => setConfigSwitches({ ...configSwitches, Link: checked })}
                                            checkedChildren="Link"
                                            unCheckedChildren="Link"
                                        />
                                        <Switch
                                            size="small"
                                            checked={configSwitches.Image}
                                            onChange={(checked) => setConfigSwitches({ ...configSwitches, Image: checked })}
                                            checkedChildren="Image"
                                            unCheckedChildren="Image"
                                        />
                                        <Switch
                                            size="small"
                                            checked={configSwitches.CodeBlock}
                                            onChange={(checked) => setConfigSwitches({ ...configSwitches, CodeBlock: checked })}
                                            checkedChildren="CodeBlock"
                                            unCheckedChildren="CodeBlock"
                                        />
                                        <Switch
                                            size="small"
                                            checked={configSwitches.InlineCode}
                                            onChange={(checked) => setConfigSwitches({ ...configSwitches, InlineCode: checked })}
                                            checkedChildren="InlineCode"
                                            unCheckedChildren="InlineCode"
                                        />
                                    </Space>

                                )}

                                {(currentDemo === '总览' ? configSwitches.Link : currentDemo === 'Link') && (
                                    <Card size="small" title="Link" style={{ background: '#fafafa' }}>
                                        <Space wrap>
                                            <Space>
                                                <span>颜色</span>
                                                <ColorPicker
                                                    size="small"
                                                    value={linkConfig.color}
                                                    onChange={(color) => setLinkConfig({ ...linkConfig, color: color.toHexString() })}
                                                />
                                            </Space>
                                            <Checkbox
                                                checked={linkConfig.bold}
                                                onChange={(e) => setLinkConfig({ ...linkConfig, bold: e.target.checked })}
                                            >
                                                加粗
                                            </Checkbox>
                                            <Checkbox
                                                checked={linkConfig.italic}
                                                onChange={(e) => setLinkConfig({ ...linkConfig, italic: e.target.checked })}
                                            >
                                                斜体
                                            </Checkbox>
                                            <Checkbox
                                                checked={linkConfig.showIcon}
                                                onChange={(e) => setLinkConfig({ ...linkConfig, showIcon: e.target.checked })}
                                            >
                                                图标
                                            </Checkbox>
                                            <Checkbox
                                                checked={linkConfig.underline}
                                                onChange={(e) => setLinkConfig({ ...linkConfig, underline: e.target.checked })}
                                            >
                                                下划线
                                            </Checkbox>
                                            <div>
                                                <span>占位符：</span>
                                                <Input
                                                    size="small"
                                                    value={linkConfig.placeholderText}
                                                    onChange={(e) => setLinkConfig({ ...linkConfig, placeholderText: e.target.value })}
                                                    style={{ width: 120 }}
                                                    placeholder="占位符文本"

                                                />
                                            </div>

                                        </Space>
                                    </Card>
                                )}

                                {(currentDemo === '总览' ? configSwitches.Image : currentDemo === 'Image') && (
                                    <Card size="small" title="Image" style={{ background: '#fafafa' }}>
                                        <Space wrap align="center">
                                            <InputNumber
                                                size="small"
                                                min={50}
                                                max={800}
                                                value={imageConfigInput.width}
                                                onChange={(v) => setImageConfigInput({ ...imageConfigInput, width: v ?? 400 })}
                                                style={{ width: 80 }}
                                            />
                                            <InputNumber
                                                size="small"
                                                min={50}
                                                max={600}
                                                value={imageConfigInput.height}
                                                onChange={(v) => setImageConfigInput({ ...imageConfigInput, height: v ?? 200 })}
                                                style={{ width: 80 }}
                                            />
                                            <div>
                                                <span>占位符：</span>
                                                <Radio.Group
                                                    size="small"
                                                    value={imageConfigInput.loadingType}
                                                    onChange={(e) => setImageConfigInput({ ...imageConfigInput, loadingType: e.target.value })}
                                                >
                                                    <Radio.Button value="skeleton">骨架屏</Radio.Button>
                                                    <Radio.Button value="custom">自定义</Radio.Button>
                                                </Radio.Group>
                                            </div>
                                            {imageConfigInput.loadingType === 'custom' && (
                                                <Input
                                                    size="small"
                                                    value={imageConfigInput.loadingText}
                                                    onChange={(e) => setImageConfigInput({ ...imageConfigInput, loadingText: e.target.value })}
                                                    style={{ width: 120 }}
                                                    placeholder="占位符文本"
                                                />
                                            )}
                                        </Space>
                                    </Card>
                                )}

                                {(currentDemo === '总览' ? configSwitches.CodeBlock : currentDemo === 'CodeBlock') && (
                                    <Card size="small" title="CodeBlock" style={{ background: '#fafafa' }}>
                                        <Space wrap align="center">
                                            <Radio.Group
                                                size="small"
                                                value={codeBlockConfig.theme}
                                                onChange={(e) => setCodeBlockConfig({ ...codeBlockConfig, theme: e.target.value })}
                                            >
                                                <Radio.Button value="vscDarkPlus">VSC Dark</Radio.Button>
                                                <Radio.Button value="oneLight">Light</Radio.Button>
                                                <Radio.Button value="dracula">Dracula</Radio.Button>
                                                <Radio.Button value="atomDark">Atom</Radio.Button>
                                            </Radio.Group>
                                            <Checkbox
                                                checked={codeBlockConfig.showLineNumbers}
                                                onChange={(e) => setCodeBlockConfig({ ...codeBlockConfig, showLineNumbers: e.target.checked })}
                                            >
                                                行号
                                            </Checkbox>
                                            <Checkbox
                                                checked={codeBlockConfig.showCopy}
                                                onChange={(e) => setCodeBlockConfig({ ...codeBlockConfig, showCopy: e.target.checked })}
                                            >
                                                复制
                                            </Checkbox>
                                            <Checkbox
                                                checked={codeBlockConfig.showFullscreen}
                                                onChange={(e) => setCodeBlockConfig({ ...codeBlockConfig, showFullscreen: e.target.checked })}
                                            >
                                                放大
                                            </Checkbox>
                                        </Space>
                                    </Card>
                                )}

                                {(currentDemo === '总览' ? configSwitches.InlineCode : currentDemo === 'InlineCode') && (
                                    <Card size="small" title="InlineCode" style={{ background: '#fafafa' }}>
                                        <Space wrap align="center">
                                            <Space>
                                                <span>背景</span>
                                                <ColorPicker
                                                    size="small"
                                                    value={inlineCodeConfig.bgColor}
                                                    onChange={(color) => setInlineCodeConfig({ ...inlineCodeConfig, bgColor: color.toHexString() })}
                                                />
                                            </Space>

                                            <Space>
                                                <span>文字</span>
                                                <ColorPicker
                                                    size="small"
                                                    value={inlineCodeConfig.color}
                                                    onChange={(color) => setInlineCodeConfig({ ...inlineCodeConfig, color: color.toHexString() })}
                                                />
                                            </Space>


                                        </Space>
                                    </Card>
                                )}
                            </Flex>
                        ) : (
                            <Typography.Text type="secondary">开启后可自定义组件样式</Typography.Text>
                        )}
                    </Card>


                    <Flex justify="space-between">
                        <Card title="Markdown Content" style={{ width: '38vw' }} size="small">
                            <div style={{
                                flex: 1,
                                minHeight: 0,
                                background: '#f5f5f5',
                                padding: 12,
                                borderRadius: 6,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                overflow: 'auto',
                                fontSize: 12,
                                lineHeight: 1.5,
                            }}
                            >
                                {streamingContent}
                            </div>


                        </Card>
                        <Card
                            title="Markdown"
                            style={{ width: '38vw' }}
                            size="small"
                            extra={
                                <Button
                                    size="small"
                                    type="primary"
                                    onClick={() => {
                                        setImageConfig(imageConfigInput);
                                        startStreaming(renderMarkdown);
                                    }}
                                >
                                    Render
                                </Button>
                            }
                        >
                            <Markdown
                                content={streamingContent}
                                openLinksInNewTab={true}
                                components={components}
                                streaming={{ enableCache: isStreaming }}
                            />
                        </Card>
                    </Flex>
                </Flex>
            </Card>
        </div>
    );
};

export default App;