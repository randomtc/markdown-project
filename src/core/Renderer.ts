
import DOMPurify from 'dompurify'
import React from 'react'
import { AnimationText } from './AnimationText'
/**
 * Renderer.functional.ts
 * 
 * HTML 渲染器 - 纯函数实现
 * 职责：将 HTML 字符串渲染为 React 元素
 * 
 * 核心流程：
 *   HTML 字符串 → XSS 净化 → 解析 DOM → 替换为自定义组件 → React 元素
 * 
 * 特性：
 *   - 组件映射：将原生 HTML 标签映射到自定义 React 组件
 *   - 流式状态检测：检测未闭合标签，传递 streamStatus 属性
 *   - XSS 防护：使用 DOMPurify 净化 HTML
 *   - 打字机动画：支持文本逐个显示的动画效果
 */

import type { ReactNode, ComponentType } from 'react';
import type { Config as DOMPurifyConfig } from 'dompurify';
import parseHtml, { domToReact, type DOMNode, type Element, type HTMLReactParserOptions } from 'html-react-parser';

// =============================================================================
// 类型定义
// =============================================================================

/**
 * 渲染器配置选项
 */
export interface RendererOptions {
    /** 自定义组件映射：键为标签名，值为 React 组件 */
    components?: Record<string, ComponentType<any>>;
    /** DOMPurify 配置（用于 XSS 防护） */
    dompurifyConfig?: DOMPurifyConfig;
    /** 流式渲染配置 */
    streaming?: {
        /** 是否启用文字淡入动画 */
        enableAnimation?: boolean;
        /** 动画配置 */
        animationConfig?: {
            /** 淡入动画持续时间（毫秒） */
            fadeDuration?: number;
            /** 缓动函数 */
            easing?: string;
        };
    };
}

/**
 * 自定义组件接收的属性
 */
export interface ComponentProps {
    /** DOM 节点引用 */
    domNode: Element;
    /** 
     * 流式状态
     * - 'loading': 标签未闭合（流式渲染中）
     * - 'done': 标签已闭合
     */
    streamStatus: 'loading' | 'done';
    /** React 唯一标识 */
    key: string;
    /** 其他 HTML 属性 */
    [key: string]: any;
}

// =============================================================================
// 常量定义
// =============================================================================

/** 非空白字符正则（用于检测有效文本节点） */
const NON_WHITESPACE_REGEX = /[^\r\s\n]+/;

/** 
 * 原生自闭合标签列表
 * 这些标签不需要闭合标签，如 <img />, <br />
 */
const SELF_CLOSING_TAGS = new Set([
    'img', 'br', 'hr', 'input', 'meta', 'link',
    'area', 'base', 'col', 'embed', 'param',
    'source', 'track', 'wbr'
]);

// =============================================================================
// 流式状态检测
// =============================================================================

/**
 * 检测未闭合的自定义标签
 * 
 * 原理：
 *   使用栈结构遍历 HTML 字符串，匹配标签的开始和结束。
 *   最终栈中剩余的就是未闭合的标签。
 * 
 * @param htmlString - HTML 字符串
 * @param components - 自定义组件映射
 * @returns 未闭合标签的集合
 */
function detectUnclosedTags(
    htmlString: string,
    components?: Record<string, ComponentType<any>>
): Set<string> {
    const unclosedTags = new Set<string>();
    const stack: string[] = [];

    // 匹配 HTML 标签的正则
    // 匹配：<tag>, </tag>, <tag/>, <tag attr="value">
    const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9-]*)(?:\s[^>]*)?>/g;

    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(htmlString)) !== null) {
        const [fullMatch, tagName] = match;
        const isClosing = fullMatch.startsWith('</');       // 是否为结束标签
        const isSelfClosing = fullMatch.endsWith('/>');     // 是否为自闭合
        const tagNameLower = tagName.toLowerCase();

        // 只处理已注册的自定义组件
        if (components?.[tagNameLower]) {
            if (isClosing) {
                // 结束标签：从栈中移除对应的开始标签
                const lastIndex = stack.lastIndexOf(tagNameLower);
                if (lastIndex !== -1) {
                    stack.splice(lastIndex, 1);
                }
            } else if (!isSelfClosing && !SELF_CLOSING_TAGS.has(tagNameLower)) {
                // 开始标签：非自闭合标签才入栈
                stack.push(tagNameLower);
            }
        }
    }

    // 栈中剩余的就是未闭合的标签
    stack.forEach((tag) => unclosedTags.add(tag));
    return unclosedTags;
}

// =============================================================================
// XSS 防护
// =============================================================================

/**
 * 配置 DOMPurify
 * 
 * 功能：
 *   - 允许自定义组件标签通过
 *   - 允许特定的 HTML 属性
 * 
 * @param components - 自定义组件映射
 * @param userConfig - 用户自定义配置
 * @returns DOMPurify 配置对象
 */
function configureDOMPurify(
    components?: Record<string, ComponentType<any>>,
    userConfig?: DOMPurifyConfig
): DOMPurifyConfig {
    const customComponents = Object.keys(components || {});

    const allowedTags = Array.isArray(userConfig?.ADD_TAGS) ? userConfig.ADD_TAGS : [];
    const addAttr = Array.isArray(userConfig?.ADD_ATTR) ? userConfig.ADD_ATTR : [];

    return {
        ...userConfig,
        // 添加自定义组件标签到白名单
        ADD_TAGS: Array.from(new Set([...customComponents, ...allowedTags])),
        // 添加自定义属性到白名单
        ADD_ATTR: Array.from(new Set([
            'target', 'rel',
            'data-stream-status',      // 流式状态属性
            'data-streaming-placeholder', // 占位符标记
            ...addAttr
        ])),
    };
}

// =============================================================================
// DOM 处理
// =============================================================================

/**
 * 处理子元素
 * 
 * 递归处理 DOM 子节点，应用组件替换逻辑
 * 
 * @param children - 子 DOM 节点数组
 * @param unclosedTags - 未闭合标签集合
 * @param cidRef - 组件 ID 计数器（用于生成唯一 key）
 * @param options - 渲染器配置
 * @returns React 子元素
 */
function processChildren(
    children: DOMNode[],
    unclosedTags: Set<string> | undefined,
    cidRef: { current: number },
    options: RendererOptions
): ReactNode {
    const replaceOptions: HTMLReactParserOptions = {
        replace: createReplaceElement(unclosedTags, cidRef, options) as unknown as HTMLReactParserOptions['replace'],
    };
    return domToReact(children as DOMNode[], replaceOptions);
}

/**
 * 创建元素替换函数
 * 
 * 这是渲染器的核心逻辑，负责：
 *   1. 将原生 HTML 标签替换为自定义组件
 *   2. 为文本节点添加打字机动画
 *   3. 传递流式状态属性
 * 
 * @param unclosedTags - 未闭合标签集合
 * @param cidRef - 组件 ID 计数器
 * @param options - 渲染器配置
 * @returns 替换函数
 */
function createReplaceElement(
    unclosedTags: Set<string> | undefined,
    cidRef: { current: number },
    options: RendererOptions
) {
    const { enableAnimation, animationConfig } = options.streaming || {};
    const { components } = options;

    return (domNode: DOMNode): ReactNode | undefined => {
        // 生成唯一 key
        const key = `md-component-${cidRef.current++}`;

        // -------------------------------------------------------------------------
        // 步骤 1：处理文本节点的打字机动画
        // -------------------------------------------------------------------------
        const isValidTextNode =
            domNode.type === 'text' &&
            domNode.data &&
            NON_WHITESPACE_REGEX.test(domNode.data);

        const parentTagName = (domNode.parent as Element)?.name;
        const isParentCustomComponent = parentTagName && components?.[parentTagName];
        const shouldAnimateText = enableAnimation && isValidTextNode && !isParentCustomComponent;

        if (shouldAnimateText) {
            return React.createElement(AnimationText, {
                text: domNode.data,
                key,
                animationConfig,
            });
        }

        // -------------------------------------------------------------------------
        // 步骤 2：处理元素节点的组件映射
        // -------------------------------------------------------------------------

        // 如果不是元素节点，返回 undefined 让默认处理

        if (!('name' in domNode)) return;

        const { name, attribs, children } = domNode as Element;

        const componentKey = name.toLowerCase();
        const customComponent = components?.[componentKey];

        if (!customComponent) return;

        const renderElement = customComponent;

        // -------------------------------------------------------------------------
        // 步骤 3：组装组件属性
        // -------------------------------------------------------------------------

        // Renderer 层流式状态：基于标签闭合检测
        const streamStatus = unclosedTags?.has(name) ? 'loading' : 'done';

        // Parser 层流式状态：从 data 属性获取
        const dataStreamStatus = attribs['data-stream-status'] as 'loading' | 'done' | undefined;

        // 构建组件属性
        const props: ComponentProps = {
            domNode: domNode as Element,
            streamStatus,
            key,
            ...attribs,  // 展开所有 HTML 属性
            'data-stream-status': dataStreamStatus,  // 保留 Parser 层状态
            // 处理布尔属性
            ...(attribs.disabled !== undefined && { disabled: true }),
            ...(attribs.checked !== undefined && { checked: true }),
        };

        // 合并 class 和 className（处理大小写差异）
        const classes = [props.className, props.classname, props.class]
            .filter(Boolean)
            .join(' ')
            .trim();
        props.className = classes || '';

        // -------------------------------------------------------------------------
        // 步骤 4：特殊处理 code 元素
        // -------------------------------------------------------------------------
        if (name === 'code') {
            const block = attribs?.['data-block'];
            const codeStreamStatus = attribs?.['data-state'];
            const langFromData = attribs?.['data-lang'];
            const langFromClass =
                attribs?.class?.match(/(?:^|\s)language-([^\s]+)/)?.[1] ??
                attribs?.class?.match(/(?:^|\s)lang-([^\s]+)/)?.[1];

            props.block = block === 'true';
            props.streamStatus = codeStreamStatus === 'loading' ? 'loading' : 'done';
            props.lang = langFromData || langFromClass;
        }

        // -------------------------------------------------------------------------
        // 步骤 5：递归处理子元素
        // -------------------------------------------------------------------------
        if (children) {
            props.children = processChildren(children as DOMNode[], unclosedTags, cidRef, options);
        }

        // -------------------------------------------------------------------------
        // 步骤 6：创建 React 元素
        // -------------------------------------------------------------------------
        return React.createElement(renderElement, props);
    };
}

// =============================================================================
// 纯函数 API
// =============================================================================

/**
 * 处理 HTML 字符串并渲染为 React 元素
 * 
 * 处理流程：
 *   1. 检测未闭合标签（流式状态）
 *   2. 使用 DOMPurify 净化 HTML（XSS 防护）
 *   3. 使用 html-react-parser 解析 HTML
 *   4. 替换映射的标签为自定义组件
 * 
 * @param htmlString - HTML 字符串
 * @param options - 渲染器配置
 * @returns React 元素
 */
export function renderHtml(htmlString: string, options: RendererOptions = {}): ReactNode {
    // 空内容检查
    if (!htmlString.trim()) return null;

    // 步骤 1：检测未闭合标签（用于流式状态判断）
    const unclosedTags = detectUnclosedTags(htmlString, options.components);

    // 组件 ID 计数器（用于生成唯一 key）
    const cidRef = { current: 0 };

    // 步骤 2：XSS 防护 - 净化 HTML
    const purifyConfig = configureDOMPurify(options.components, options.dompurifyConfig);
    const cleanHtml = DOMPurify.sanitize(htmlString, purifyConfig);

    // 步骤 3 & 4：解析 HTML 并替换为自定义组件
    const replaceOptions: HTMLReactParserOptions = {
        replace: createReplaceElement(unclosedTags, cidRef, options) as unknown as HTMLReactParserOptions['replace'],
    };

    return parseHtml(cleanHtml, replaceOptions);
}