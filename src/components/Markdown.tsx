
import React, { useMemo } from 'react'
import { parseMarkdown, renderHtml } from '../core'
import { useStreaming, type UseStreamingOptions } from '../hooks/useStreaming';

export interface MarkdownProps {
    /** Markdown 内容 */
    content: string;


    /** 流式渲染选项 */
    streaming?: UseStreamingOptions;
    /** 自定义类名 */
    className?: string;
    components?: any
    openLinksInNewTab?: boolean
}

/**
 * Markdown 组件 - 核心入口（函数式实现）
 * 
 * 架构设计：
 * 1. useStreaming: 流式预处理 → 生成占位符
 * 2. parseMarkdown: Markdown -> HTML (语法解析层)
 * 3. renderHtml: HTML -> React (视图渲染层)
 */
export const Markdown: React.FC<MarkdownProps> = ({
    content,

    streaming,
    components,
    openLinksInNewTab,
    className = '',
}) => {
    // 步骤 1: 流式预处理（支持占位符生成）
    const streamingContent = useStreaming(content, { ...streaming, components });


    // 使用 useMemo 缓存解析结果，避免重复计算
    const reactContent = useMemo(() => {
        // 步骤 2: 解析 Markdown 为 HTML（纯函数）

        // console.log("🚀 ~ Markdown ~ streamingContent:", streamingContent)
        const html = parseMarkdown(streamingContent, { openLinksInNewTab });

        // 步骤 3: 渲染 HTML 为 React 元素（纯函数）
        return renderHtml(html, { components });
    }, [streamingContent, components, openLinksInNewTab]);

    return (
        <div className={`markdown-body ${className}`}>
            {reactContent}
        </div>
    );
}

export default Markdown;