import React, { useState, useCallback, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";
import { Card, Flex, Button, InputNumber, Radio, Input } from "antd";
import { Markdown } from "./components/Markdown";
import { SkeletonImage } from "./components/SkeletonImage";

interface ComparisonDemoProps {
    initialContent?: string;
}

/**
 * 渲染引擎对比组件
 * 对比本项目 Markdown 渲染与 Streamdown 渲染效果
 */
export const ComparisonDemo: React.FC<ComparisonDemoProps> = ({
    initialContent = ` ![React](https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg)`,
}) => {

    // ![React](https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg)

    // 流式渲染状态
    const [content, setContent] = useState<string>("");
    const [isStreaming, setIsStreaming] = useState<boolean>(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Image 配置
    const [imageConfig, setImageConfig] = useState({
        width: 200,
        height: 150,
        preview: true,
        loadingType: 'skeleton' as 'skeleton' | 'custom',
        loadingText: '加载中...',
    });

    // 本项目的自定义组件配置（仅 Image）
    const components = {
        img: (props: any) => (
            <SkeletonImage
                {...props}
                width={imageConfig.width}
                height={imageConfig.height}
                preview={imageConfig.preview}
                loading={imageConfig.loadingType === 'custom' ? <div style={{ width: imageConfig.width, height: imageConfig.height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', borderRadius: 4 }}>{imageConfig.loadingText}</div> : undefined}
            />
        ),
        "incomplete-image": (props: any) => (
            <SkeletonImage
                {...props}
                width={imageConfig.width}
                height={imageConfig.height}
                preview={imageConfig.preview}
                loading={imageConfig.loadingType === 'custom' ? <div style={{ width: imageConfig.width, height: imageConfig.height, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', borderRadius: 4 }}>{imageConfig.loadingText}</div> : undefined}
            />
        ),
    };

    /** 清除流式定时器 */
    const clearStreamingInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    /** 开始流式渲染 */
    const startStreaming = useCallback(() => {
        // 清除之前的定时器
        clearStreamingInterval();
        // 先清空内容
        setContent("");
        setIsStreaming(true);

        // 使用 setTimeout 确保清空后再开始新的流式输出
        setTimeout(() => {
            const chars = initialContent.split("");
            let index = 0;

            intervalRef.current = setInterval(() => {
                if (index < chars.length) {
                    const chunkSize = Math.floor(Math.random() * 3) + 1;
                    const chunk = chars.slice(index, index + chunkSize).join("");
                    index += chunkSize;
                    setContent((prev) => prev + chunk);
                } else {
                    clearStreamingInterval();
                    setIsStreaming(false);
                }
            }, 30);
        }, 50);
    }, [initialContent, clearStreamingInterval]);

    // 组件卸载时清理定时器
    useEffect(() => {
        return () => {
            clearStreamingInterval();
        };
    }, [clearStreamingInterval]);

    return (
        <Card
            size="small"
            title="图片渲染对比"
        >
            <Flex vertical gap="middle">
                {/* Image 配置面板 */}
                <Card size="small" title="Image 配置" style={{ background: '#fafafa' }}>
                    <Flex gap="small" align="center" wrap>
                        <span>图片尺寸:</span>
                        <InputNumber
                            size="small"
                            min={50}
                            max={800}
                            value={imageConfig.width}
                            onChange={(v) => setImageConfig({ ...imageConfig, width: v ?? 200 })}
                            style={{ width: 70 }}
                        />
                        <span>x</span>
                        <InputNumber
                            size="small"
                            min={50}
                            max={600}
                            value={imageConfig.height}
                            onChange={(v) => setImageConfig({ ...imageConfig, height: v ?? 150 })}
                            style={{ width: 70 }}
                        />
                        <Radio.Group
                            size="small"
                            value={imageConfig.loadingType}
                            onChange={(e) => setImageConfig({ ...imageConfig, loadingType: e.target.value })}
                        >
                            <Radio.Button value="skeleton">骨架屏</Radio.Button>
                            <Radio.Button value="custom">自定义</Radio.Button>
                        </Radio.Group>
                        {imageConfig.loadingType === 'custom' && (
                            <Input
                                size="small"
                                value={imageConfig.loadingText}
                                onChange={(e) => setImageConfig({ ...imageConfig, loadingText: e.target.value })}
                                style={{ width: 100 }}
                            />
                        )}
                    </Flex>
                </Card>



                <Card title="Markdown Content" size="small" extra={<Button type="primary" size="small" onClick={startStreaming}>Render</Button>}>
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
                        {content}
                    </div>
                </Card>


                {/* 渲染区域 */}
                <Flex justify="space-between" gap="middle">
                    <Card
                        size="small"
                        title="本项目渲染效果"
                        style={{ background: "#fafafa", flex: 1 }}
                    >
                        <Markdown
                            content={content}
                            openLinksInNewTab={true}
                            components={components}
                            streaming={{ enableCache: isStreaming }}
                        />
                    </Card>
                    <Card
                        size="small"
                        title="Streamdown 渲染效果"
                        style={{ background: "#fafafa", flex: 1 }}
                    >
                        <Streamdown
                            mode={isStreaming ? "streaming" : "static"}
                            animated={false}
                        >
                            {content}
                        </Streamdown>



                    </Card>
                </Flex>

            </Flex>
        </Card>
    );
};

export default ComparisonDemo;
