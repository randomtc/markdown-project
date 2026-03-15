
import { Marked, Renderer as MarkedRenderer, Tokens } from 'marked'

/**
 * Parser - Markdown 解析器（纯函数实现）
 * 
 * 核心职责：将 Markdown 文本解析为 HTML 字符串
 * 处理流程：Markdown → Marked 解析 → HTML
 * 
 * @example
 * const html = parseMarkdown('# Hello', { openLinksInNewTab: true });
 * // => '<h1>Hello</h1>\n'
 */

/** 解析器配置选项 */
export interface ParserOptions {
    /** 链接在新标签页打开 */
    openLinksInNewTab?: boolean;
    /** 自定义段落标签 */
    paragraphTag?: string;
    /** 转义原始 HTML（XSS 防护） */
    escapeRawHtml?: boolean;
    /** 自定义 marked 扩展 */
    extensions?: import('marked').MarkedExtension[];
}

// ============================================================================
// HTML 转义（XSS 防护）
// ============================================================================

const escapeReplacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
};

const escapeTest = /[&<>"'/]/;
const escapeReplace = /[&<>"'/]/g;

/**
 * 转义 HTML 特殊字符，防止 XSS 攻击
 * @example escapeHtml('<script>') // => '&lt;script&gt;'
 */
export function escapeHtml(html: string): string {
    // 快速路径：如果没有特殊字符，直接返回
    if (!escapeTest.test(html)) return html;

    // 替换所有特殊字符为对应的 HTML 实体
    return html.replace(escapeReplace, (ch) => escapeReplacements[ch]);
}

// =============================================================================
// 正则表达式常量
// =============================================================================

/** 
 * 代码块完整性检测正则
 * 匹配：```lang\ncontent\n``` 或 ~~~lang\ncontent\n~~~
 * 宽松模式：允许末尾无换行
 */
const completeFencedCode = /^ {0,3}(```+|~~~+)[\s\S]*?\1\s*$/;

/** 匹配非空白字符开头 */
const notSpaceStart = /^\S*/;

/** 匹配结尾换行符 */
const endingNewline = /\n$/;

/** 
 * 完整图片语法检测
 * 匹配：![alt](url) 或 ![alt](url "title")
 */
const completeImageRegex = /^!\[([^\]]*)\]\(([^)]+)\)$/;

// =============================================================================
// Marked 渲染器配置函数
// =========================================================================== ==

/**
 * 配置链接渲染器
 * 功能：支持在新标签页打开链接
 * 
 * @param markdownInstance - Marked 实例
 * @param options - 解析器配置
 */
function configureLinkRenderer(
    markdownInstance: Marked,
    options: ParserOptions
): void {
    // 如果未启用新标签页打开，跳过配置
    if (!options.openLinksInNewTab) return;

    const renderer = {
        /**
         * 链接渲染函数
         * 
         * @example
         * [**Google**](https://google.com) => <a href="..." target="_blank"><strong>Google</strong></a>
         */
        link(this: MarkedRenderer, { href, title, tokens }: Tokens.Link): string {
            // 解析链接文本内的内联 token（支持加粗、斜体等）
            const text = this.parser.parseInline(tokens);

            // 构建 title 属性
            const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';

            // 返回带 target="_blank" 的链接
            return `<a href="${escapeHtml(href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
        },
    };

    // 注册渲染器到 Marked 实例
    markdownInstance.use({ renderer });
}



/**
 * 配置图片渲染器
 * 功能：支持流式状态检测，为 img 标签添加 data-stream-status 属性
 * 
 * @param markdownInstance - Marked 实例
 */
function configureImageRenderer(markdownInstance: Marked): void {
    const renderer = {
        /**
         * 图片渲染函数
         * 支持语法：![alt](url)、![alt](url "title")、![alt](url =300x200)
         */
        image(this: MarkedRenderer, { href, title, text }: Tokens.Image): string {
            // 重构原始 Markdown 语法用于完整性检测
            const raw = `![${text}](${href}${title ? ` "${title}"` : ''})`;

            // 检测图片语法是否完整
            const isComplete = completeImageRegex.test(raw);
            const streamStatus = isComplete ? 'done' : 'loading';

            // 构建属性
            const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
            const altAttr = escapeHtml(text || '');
            const srcAttr = escapeHtml(href || '');

            // 返回带 data-stream-status 属性的 img 标签
            return `<img src="${srcAttr}" alt="${altAttr}"${titleAttr} data-stream-status="${streamStatus}" />`;
        },
    };

    markdownInstance.use({ renderer });
}

/**
 * 配置段落渲染器
 * 功能：支持自定义段落标签
 * 
 * @param markdownInstance - Marked 实例
 * @param options - 解析器配置
 */
function configureParagraphRenderer(
    markdownInstance: Marked,
    options: ParserOptions
): void {
    const { paragraphTag } = options;

    // 如果未指定自定义段落标签，跳过配置
    if (!paragraphTag) return;

    const renderer = {
        /**
         * 段落渲染函数
         */
        paragraph(this: MarkedRenderer, { tokens }: Tokens.Paragraph): string {
            // 使用自定义标签包裹段落内容
            return `<${paragraphTag}>${this.parser.parseInline(tokens)}</${paragraphTag}>\n`;
        },
    };

    markdownInstance.use({ renderer });
}

/**
 * 配置代码块渲染器
 * 功能：支持流式状态检测，判断代码块是否完整
 * 
 * @param markdownInstance - Marked 实例
 */
function configureCodeRenderer(markdownInstance: Marked): void {
    const renderer = {
        /**
         * 代码块渲染函数
         * 
         * @example
         * ```javascript
         * console.log('hello');
         * ```
         * =>
         * <pre><code data-block="true" data-state="done" class="language-javascript">console.log('hello');\n</code></pre>
         */
        code({ text, raw, lang, escaped, codeBlockStyle }: Tokens.Code): string {
            // 提取代码信息
            const infoString = (lang || '').trim();
            const langString = infoString.match(notSpaceStart)?.[0] || '';
            const code = `${text.replace(endingNewline, '')}\n`;
            const isIndentedCode = codeBlockStyle === 'indented';

            // 流式状态检测：判断代码块是否完整
            // 缩进式代码块或匹配围栏式代码块正则的视为完整
            const streamStatus = isIndentedCode || completeFencedCode.test(raw) ? 'done' : 'loading';

            // 转义代码内容（如果未转义过）
            const escapedCode = escaped ? code : escapeHtml(code);

            // 构建 class 属性
            const classAttr = langString ? ` class="language-${escapeHtml(langString)}"` : '';

            // 构建 data 属性
            const dataAttrs =
                ` data-block="true" data-state="${streamStatus}"` +
                (infoString ? ` data-lang="${escapeHtml(infoString)}"` : '');

            // 返回代码块 HTML
            return `<pre><code${dataAttrs}${classAttr}>${escapedCode}</code></pre>\n`;
        },
    };

    markdownInstance.use({ renderer });
}

/**
 * 配置 HTML 转义渲染器
 * 功能：XSS 防护，转义原始 HTML
 * 
 * @param markdownInstance - Marked 实例
 * @param options - 解析器配置
 */
function configureHtmlEscapeRenderer(
    markdownInstance: Marked,
    options: ParserOptions
): void {
    // 如果未启用 HTML 转义，跳过配置
    if (!options.escapeRawHtml) return;

    const renderer = {
        /**
         * HTML 标签渲染函数
         * 将原始 HTML 转义为普通文本，防止 XSS
         */
        html(this: MarkedRenderer, token: Tokens.HTML | Tokens.Tag): string {
            const { raw = '', text = '' } = token;
            return escapeHtml(raw || text);
        },
    };

    markdownInstance.use({ renderer });
}




// =============================================================================
// Marked 实例创建
// =============================================================================

/**
 * 创建并配置 Marked 实例
 * 
 * 配置顺序：
 *   1. 链接渲染器（新标签页打开）
 *   2. 段落渲染器（自定义标签）
 *   3. 代码块渲染器（流式状态检测）
 *   4. HTML 转义渲染器（XSS 防护）
 *   5. 图片渲染器（流式状态检测）
 *   6. 用户自定义扩展
 * 
 * @param options - 解析器配置
 * @returns 配置好的 Marked 实例
 */
function createMarkedInstance(options: ParserOptions): Marked {
    const markdownInstance = new Marked();

    // 按顺序配置渲染器
    configureLinkRenderer(markdownInstance, options);
    configureParagraphRenderer(markdownInstance, options);
    configureCodeRenderer(markdownInstance);
    configureHtmlEscapeRenderer(markdownInstance, options);
    configureImageRenderer(markdownInstance);

    // 应用用户自定义扩展
    if (options.extensions?.length) {
        markdownInstance.use(...options.extensions);
    }

    return markdownInstance;
}

// =============================================================================
// 纯函数 API
// =============================================================================

/**
 * 解析 Markdown 为 HTML（纯函数版）
 * 
 * 处理流程：
 *    Marked 解析：将 Markdown 转为 HTML
 * 
 * @param content - Markdown 文本
 * @param options - 解析器配置
 * @returns HTML 字符串
 */
export function parseMarkdown(content: string, options: ParserOptions = {}): string {
    try {
        const markdownInstance = createMarkedInstance(options);
        return markdownInstance.parse(content) as string;
    } catch (error) {
        console.error('Markdown parse error:', error);
        return `<p>${escapeHtml(content)}</p>`; // 降级为纯文本
    }
}