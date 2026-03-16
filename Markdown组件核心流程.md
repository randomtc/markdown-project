# Markdown 组件核心流程

## 架构设计

三层纯函数管道：

```
Markdown 文本 → 流式预处理 → HTML → React 元素
```

## 核心流程

### 1. 流式预处理 (useStreaming)

**Streaming Tokenizer 模式**：逐字符处理，识别未闭合语法

```
输入字符流 → Token识别 → 状态缓存 → 占位符生成
```

| 核心机制        | 说明                                                          |
| --------------- | ------------------------------------------------------------- |
| StreamCache     | 维护 pending（未完成）、complete（已完成）、token（当前类型） |
| TokenRecognizer | 识别 Markdown 语法开始与结束（Image、Link、Text）             |
| 占位符生成      | 未闭合语法生成 `incomplete-{token}` 组件                      |

**示例**：`![图片`（未闭合）→ 生成 `<incomplete-image />` 占位符

### 2. 解析 Markdown (parseMarkdown)

- 使用 Marked 库解析为 HTML
- 支持自定义渲染器（链接、图片、代码块等）
- 配置：新标签页打开链接

### 3. 渲染 React (renderHtml)

- 使用 html-react-parser 转换 HTML
- 支持自定义组件映射（components 属性）
- XSS 防护：DOMPurify 净化

## 关键优化

| 优化点 | 实现方式                  |
| ------ | ------------------------- |
| 性能   | useMemo 缓存解析结果      |
| 安全   | DOMPurify 净化 HTML       |
| 扩展   | components 属性自定义组件 |
| 流式   | useStreaming 处理增量内容 |

## 使用示例

```tsx
<Markdown
  content={markdownText}
  components={{ img: SkeletonImage, a: CustomLink }}
  streaming={{ enableCache: true }}
/>
```

## 特点

- **纯函数设计**：无副作用，可预测
- **分层清晰**：解析与渲染分离
- **高度可扩展**：自定义组件映射
- **流式友好**：支持 AI 流式输出场景
