import React, { useCallback, useState } from 'react'
import { AlertBox } from './components/AlertBox'
import { Markdown } from './components/Markdown'
import { SkeletonImage } from './components/SkeletonImage'
import './App.css'

/**
 * 默认 Markdown 内容（编辑模式）
 */
const DEFAULT_CONTENT = `# Markdown 编译器

## 核心特性

- **分层架构**: Parser → HTML → React
- **自定义组件**: 支持流式状态检测
- **图片骨架屏**: 流式渲染时自动显示占位

<alert type="info">
  这是一个自定义 Alert 组件！
</alert>

## 代码示例

\`\`\`typescript
const greeting = "Hello World";
\`\`\`

## 图片示例

![示例图片](https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png)

## 表格

| 功能 | 状态 |
|------|------|
| 流式渲染 | ✅ |
| 骨架屏 | ✅ |
`;


/**
 * 流式演示文本（模拟 AI 输出）
 */

// const STREAM_DEMO_TEXT = `

// ![示例图片](https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png)


// `;

const STREAM_DEMO_TEXT = `# 流式渲染演示

这是**模拟 AI 流式输出**的内容！

<alert type="info">
  组件会自动检测流式状态
</alert>

![示例图片](https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png)


[Ant Design X](https://github.com/ant-design/x)


\`\`\`typescript
const greeting = "Hello World";
\`\`\`

| 功能 | 状态 |
|------|------|
| 打字机 | ✅ |
| 骨架屏 | ✅ |
`;

const App: React.FC = () => {

    const [enableAnimation, setEnableAnimation] = useState(false);
    const [openInNewTab, setOpenInNewTab] = useState(true);
    const [streamingContent, setStreamingContent] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [demoMode, setDemoMode] = useState<'edit' | 'stream'>('edit');

    // 根据开关选择组件映射
    const components = {
        alert: AlertBox,
        'incomplete-link': AlertBox,
        'incomplete-image': SkeletonImage,
        'img': SkeletonImage,
    }
    // enableCache 始终为 true，确保流式缓存正常工作


    /** 开始流式演示（模拟 AI 逐字输出） */
    const startStreaming = useCallback(() => {
        // 先清空内容，确保缓存重置
        setStreamingContent('');
        // 使用 setTimeout 确保清空后再开始新的流式输出
        setTimeout(() => {
            setIsStreaming(true);
            const chars = STREAM_DEMO_TEXT.split('');
            let index = 0;

            const interval = setInterval(() => {
                if (index < chars.length) {
                    const chunkSize = Math.floor(Math.random() * 3) + 1;
                    const chunk = chars.slice(index, index + chunkSize).join('');
                    index += chunkSize;
                    setStreamingContent(prev => prev + chunk);
                } else {
                    clearInterval(interval);
                    setIsStreaming(false);
                }
            }, 30);
        }, 50);

        return () => { };
    }, []);

    /** 切换编辑/流式模式 */
    const toggleMode = (mode: 'edit' | 'stream') => {
        setDemoMode(mode);
        if (mode === 'stream' && !isStreaming && !streamingContent) {
            startStreaming();
        }
    };

    return (
        <div className="app">

            {/* 控制面板 */}
            <div className="app-controls">
                <label>
                    <input
                        type="checkbox"
                        checked={enableAnimation}
                        onChange={(e) => setEnableAnimation(e.target.checked)}
                    />
                    打字机动画
                </label>
                <label>
                    <input
                        type="checkbox"
                        checked={openInNewTab}
                        onChange={(e) => setOpenInNewTab(e.target.checked)}
                    />
                    新标签页打开
                </label>
                <button
                    className={demoMode === 'edit' ? 'active' : ''}
                    onClick={() => toggleMode('edit')}
                >
                    编辑模式
                </button>
                <button
                    className={demoMode === 'stream' ? 'active' : ''}
                    onClick={() => toggleMode('stream')}
                    disabled={isStreaming}
                >
                    {isStreaming ? '流式中...' : '流式演示'}
                </button>
                {demoMode === 'stream' && !isStreaming && streamingContent && (
                    <button onClick={startStreaming}>重新播放</button>
                )}
            </div>

            {/* 主内容区 */}
            <div className="app-content">
                {demoMode === 'edit' ? (
                    <>
                        {/* 编辑模式：左右分栏 */}
                        <div className="editor-panel">
                            <h2>输入</h2>
                            <textarea
                                value={DEFAULT_CONTENT}

                                className="markdown-input"
                            />
                        </div>
                        <div className="preview-panel">
                            <h2>预览</h2>
                            <Markdown content={STREAM_DEMO_TEXT} />
                        </div>
                    </>
                ) : (
                    /* 流式模式：全屏演示 */
                    <div className="stream-panel">
                        <h2>🚀 流式渲染演示</h2>
                        <Markdown
                            content={streamingContent}
                            openLinksInNewTab={true}
                            components={components}
                            streaming={{ enableCache: true }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default App;