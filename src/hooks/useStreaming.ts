
import {
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react'
/**
 * useStreaming.ts
 * 
 * 流式渲染 Hook - 支持多种 token 类型的占位符
 * 
 * 核心功能：
 *   - 逐字符处理流式输入
 *   - 识别不完整的 Markdown 语法（image、link、table、code 等）
 *   - 生成占位符组件，实现渐进式渲染
 * 
 */

import type { ComponentType } from 'react';

// =============================================================================
// 类型定义
// =============================================================================

/** Token 类型枚举 */
export enum StreamTokenType {
    Text = 'text',
    Image = 'image',
    Link = 'link',
}

/** 流式缓存数据结构 */
export interface StreamCache {
    /** 当前未完成的片段 */
    pending: string;
    /** 当前 token 类型 */
    token: StreamTokenType;
    /** 已处理的长度 */
    processedLength: number;
    /** 已完成的 Markdown */
    completeMarkdown: string;
}

/** 识别器接口 */
interface TokenRecognizer {
    tokenType: StreamTokenType;
    /** 检测是否为该 token 的开始 */
    isStartOfToken: (markdown: string) => boolean;
    /** 检测流式内容是否仍有效（未闭合） */
    isStreamingValid: (markdown: string) => boolean;
    /** 可选：获取部分提交的前缀 */
    getCommitPrefix?: (pending: string) => string | null;
}

/** useStreaming 配置选项 */
export interface UseStreamingOptions {
    /** 是否启用流式缓存 */
    enableCache?: boolean;
    /** 自定义组件映射（用于生成占位符） */
    components?: Record<string, ComponentType<any>>;
}

// =============================================================================
// 正则表达式常量
// =============================================================================

/** 
 * 流式不完整检测正则
 * 用于检测各种 Markdown 语法是否处于未闭合状态
 * 
 * 扩展指南：
 *   1. 在 StreamTokenType 枚举中添加新类型
 *   2. 在此添加对应的正则
 *   3. 在 tokenRecognizerMap 中添加识别器
 */
const STREAM_INCOMPLETE_REGEX = {
    image: [/^!\[[^\]\r\n]{0,1000}$/, /^!\[[^\r\n]{0,1000}\]\(*[^)\r\n]{0,1000}$/],
    link: [/^\[[^\]\r\n]{0,1000}$/, /^\[[^\r\n]{0,1000}\]\(*[^)\r\n]{0,1000}$/],
    htmlImg: [/^<img\s[^>]{0,2000}$/i],
} as const;

// =============================================================================
// Token 识别器
// = ============================================================================

/** Token 识别器映射表
 * 
 * 扩展指南：
 *   1. 在 StreamTokenType 枚举中添加新类型
 *   2. 在 STREAM_INCOMPLETE_REGEX 中添加对应的正则
 *   3. 在此处添加识别器配置
 */
const tokenRecognizerMap: Partial<Record<StreamTokenType, TokenRecognizer>> = {
    [StreamTokenType.Link]: {
        tokenType: StreamTokenType.Link,
        isStartOfToken: (markdown: string) => markdown.startsWith('['),
        isStreamingValid: (markdown: string) =>
            STREAM_INCOMPLETE_REGEX.link.some((re: RegExp) => re.test(markdown)),
    },
    [StreamTokenType.Image]: {
        tokenType: StreamTokenType.Image,
        isStartOfToken: (markdown: string) => markdown.startsWith('!'),
        isStreamingValid: (markdown: string) =>
            STREAM_INCOMPLETE_REGEX.image.some((re: RegExp) => re.test(markdown)),
    },
};

/** 识别器处理器列表 */
const recognizeHandlers = Object.values(tokenRecognizerMap).map((rec) => ({
    tokenType: rec.tokenType,
    recognize: (cache: StreamCache): void => recognizeToken(cache, rec.tokenType),
}));

// =============================================================================
// 工具函数
// =============================================================================

/** 创建初始缓存 */
const createInitialCache = (): StreamCache => ({
    pending: '',
    token: StreamTokenType.Text,
    processedLength: 0,
    completeMarkdown: '',
});

/** 提交缓存：将 pending 内容移到 complete */
const commitCache = (cache: StreamCache): void => {
    if (cache.pending) {
        cache.completeMarkdown += cache.pending;
        cache.pending = '';
    }
    cache.token = StreamTokenType.Text;
};

/** 
 * 识别 Token 类型
 * 
 * 逻辑：
 *   1. 如果当前是 Text，检测是否进入新的 token
 *   2. 如果当前是特定 token，检测是否仍有效（未闭合）
 *   3. 如果已闭合，提交缓存
 */
const recognizeToken = (cache: StreamCache, tokenType: StreamTokenType): void => {
    const recognizer = tokenRecognizerMap[tokenType];
    if (!recognizer) return;

    const { token, pending } = cache;

    // 从 Text 进入新的 token
    if (token === StreamTokenType.Text && recognizer.isStartOfToken(pending)) {
        cache.token = tokenType;
        return;
    }

    // 当前 token 已失效（已闭合），提交缓存
    if (token === tokenType && !recognizer.isStreamingValid(pending)) {
        const prefix = recognizer.getCommitPrefix?.(pending);
        if (prefix) {
            // 部分提交：如列表符号后的内容属于下一个 token
            cache.completeMarkdown += prefix;
            cache.pending = pending.slice(prefix.length);
            cache.token = StreamTokenType.Text;
            return;
        }
        commitCache(cache);
    }
};

/** 检测是否在代码块内 */
const isInCodeBlock = (text: string, isFinalChunk = false): boolean => {
    const lines = text.split('\n');
    let inFenced = false;
    let fenceChar = '';
    let fenceLen = 0;

    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine;

        const match = line.match(/^(```|~~~)(.*)$/);
        if (match) {
            const fence = match[1];
            const after = match[2];
            const char = fence[0];
            const len = fence.length;

            if (!inFenced) {
                inFenced = true;
                fenceChar = char;
                fenceLen = len;
            } else {
                // 检查是否为有效的闭合围栏
                const isValidEnd = char === fenceChar && len >= fenceLen && /^\s*$/.test(after);

                if (isValidEnd) {
                    // 流式场景下，只有最终块或后面还有内容时才闭合
                    if (isFinalChunk || i < lines.length - 1) {
                        inFenced = false;
                        fenceChar = '';
                        fenceLen = 0;
                    }
                }
            }
        }
    }

    return inFenced;
};

/** 安全编码 URI 组件（处理代理对） */
const sanitizeForURIComponent = (input: string): string => {
    let result = '';
    for (let i = 0; i < input.length; i++) {
        const charCode = input.charCodeAt(i);

        // 处理代理对：保留合法，跳过孤立
        if (charCode >= 0xd800 && charCode <= 0xdbff) {
            // 高代理项
            if (
                i + 1 < input.length &&
                input.charCodeAt(i + 1) >= 0xdc00 &&
                input.charCodeAt(i + 1) <= 0xdfff
            ) {
                result += input[i] + input[i + 1];
                i++; // 跳过低代理项
            }
            // 孤立高代理项被跳过
        } else if (charCode < 0xdc00 || charCode > 0xdfff) {
            // 非孤立低代理项，直接添加
            result += input[i];
        }
        // 孤立低代理项被跳过
    }
    return result;
};

/** 安全的 encodeURIComponent */
const safeEncodeURIComponent = (str: string): string => {
    try {
        return encodeURIComponent(str);
    } catch (e) {
        if (e instanceof URIError) {
            return encodeURIComponent(sanitizeForURIComponent(str));
        }
        return '';
    }
};

// =============================================================================
// 占位符生成
// =============================================================================

/** 
 * 处理不完整的 Markdown，生成占位符
 * 
 * 规则：直接使用 `incomplete-{token}` 作为组件名
 * 例如：Image → incomplete-image, Link → incomplete-link
 * 
 * @param cache - 流式缓存
 * @param components - 注册的组件
 * @returns 占位符 HTML 或 undefined
 */
const generatePlaceholder = (
    cache: StreamCache,
    components?: Record<string, ComponentType<any>>,
): string | undefined => {
    const { token, pending } = cache;

    if (token === StreamTokenType.Text) return;
    if (token === StreamTokenType.Image && pending === '!') return;

    const componentName = `incomplete-${token}`;
    const encodedPending = safeEncodeURIComponent(pending);

    // 如果组件已注册，返回占位符；否则返回原始 pending 文本
    return components?.[componentName]
        ? `<${componentName} data-raw="${encodedPending}" />`
        : pending;
};

// =============================================================================
// Main Hook
// =============================================================================

/**
 * 流式渲染 Hook
 * 
 * @param input - 输入字符串
 * @param options - 配置选项
 * @returns 处理后的字符串（包含占位符）
 */
export const useStreaming = (
    input: string,
    options?: UseStreamingOptions,
): string => {
    const { enableCache = false, components } = options || {};

    const [output, setOutput] = useState('');
    const cacheRef = useRef<StreamCache>(createInitialCache());

    /** 处理流式内容 */
    const processStreaming = useCallback(
        (text: string): void => {
            if (!text) {
                setOutput('');
                cacheRef.current = createInitialCache();
                return;
            }

            const cache = cacheRef.current;
            const expectedPrefix = cache.completeMarkdown + cache.pending;

            // 如果输入不连续，重置缓存
            if (!text.startsWith(expectedPrefix)) {
                cacheRef.current = createInitialCache();
            }

            const currentCache = cacheRef.current;
            const chunk = text.slice(currentCache.processedLength);
            if (!chunk) return;

            currentCache.processedLength += chunk.length;

            // 逐字符处理
            for (const char of chunk) {
                currentCache.pending += char;

                // 检查是否在代码块内
                const isContentInCodeBlock = isInCodeBlock(
                    currentCache.completeMarkdown + currentCache.pending,
                );
                if (isContentInCodeBlock) {
                    commitCache(currentCache);
                    continue;
                }

                // 识别 token 类型
                if (currentCache.token === StreamTokenType.Text) {
                    // 尝试所有识别器
                    for (const handler of recognizeHandlers) {
                        handler.recognize(currentCache);
                    }
                } else {
                    // 继续识别当前 token
                    const handler = recognizeHandlers.find(
                        (h) => h.tokenType === currentCache.token,
                    );
                    handler?.recognize(currentCache);
                }

                // Text 类型直接提交
                if (currentCache.token === StreamTokenType.Text) {
                    commitCache(currentCache);

                }
            }

            // 生成占位符并输出
            const placeholder = generatePlaceholder(currentCache, components);


            setOutput(currentCache.completeMarkdown + (placeholder || ''));
        },
        [components],
    );

    useEffect(() => {
        if (typeof input !== 'string') {
            setOutput('');
            return;
        }

        enableCache ? processStreaming(input) : setOutput(input);
    }, [input, enableCache, processStreaming]);

    return output;
};

export default useStreaming;