

export const demos = [
    {
        title: '总览',
        content: `
### 支持的 Markdown 语法

- **文本样式**: [链接](https://github.com/ant-design/x)、**加粗**、*斜体*、~~删除线~~
- **图片**: 支持骨架屏占位、自定义尺寸 ![React](https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg)
- **代码**: 行内代码 \`npm install\` 和代码块
- **表格**: 标准 Markdown 表格

### 自定义组件配置

- **Image**: 宽度/高度、占位符类型（骨架屏/自定义）
- **Link**: 颜色、加粗、斜体、图标、下划线、占位符文本
- **CodeBlock**: 语法高亮、复制、放大

\`\`\`typescript
// 示例代码
const greeting = "Hello Markdown!";
console.log(greeting);
\`\`\`
`,
    },
    {
        title: 'Link',
        content: '[Google](https://www.google.com/)  for more details.',
    },
    {
        title: 'Image',
        content:
            '![React](https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg)',
    },

    {
        title: 'CodeBlock',
        content: `\`\`\`typescript
import React from 'react';
import { Button } from 'antd';

const App: React.FC = () => {
    return (
        <div>
            <Button type="primary">Hello World</Button>
        </div>
    );
};

export default App;
\`\`\``,
    },
];