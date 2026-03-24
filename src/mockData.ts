

export const demos = [
    {
        title: '总览',
        content: `
### 支持的 Markdown 语法

- **代码**: 行内代码 \`npm install\` 和代码块
- **链接**: [链接](https://github.com/ant-design/x) 支持颜色、加粗、斜体、图标、下划线
- **图片**: 骨架屏占位、自定义尺寸、点击放大 ![React](https://gw.alipayobjects.com/zos/antfincdn/aPkFc8Sj7n/method-draw-image.svg)

### 自定义组件配置

- **CodeBlock**: 主题切换、行号、复制、放大
- **InlineCode**: 背景色、文字颜色自定义
- **Link**: 颜色、加粗、斜体、图标、下划线、占位符
- **Image**: 宽度/高度、占位符类型（骨架屏/自定义）

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
        title: 'InlineCode',
        content: `支持行内代码样式自定义：

代码：\`const x = 1\`、\`function()\`

命令行：
- \`npm install react\`
- \`yarn add antd\`
- \`pnpm dev\`
- \`npx create-react-app my-app\`
- \`npm run build\`

可在配置面板自定义背景和文字颜色，或开关命令行样式。`,
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