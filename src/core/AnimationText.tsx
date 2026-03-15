import React, { useEffect, useState } from 'react';

interface AnimationTextProps {
    text: string;
    animationConfig?: {
        fadeDuration?: number;
        easing?: string;
    };
}

/**
 * AnimationText - 打字机动画文本组件
 * 
 * 功能：为文本节点添加淡入动画效果
 * 
 * @example
 * <AnimationText text="Hello World" animationConfig={{ fadeDuration: 300 }} />
 */
export const AnimationText: React.FC<AnimationTextProps> = ({
    text,
    animationConfig = {},
}) => {
    const { fadeDuration = 200, easing = 'ease-out' } = animationConfig;
    const [visibleChars, setVisibleChars] = useState(0);

    useEffect(() => {
        if (visibleChars < text.length) {
            const timer = setTimeout(() => {
                setVisibleChars((prev) => prev + 1);
            }, fadeDuration / text.length);
            return () => clearTimeout(timer);
        }
    }, [visibleChars, text.length, fadeDuration]);

    return (
        <span
            style={{
                display: 'inline',
                transition: `opacity ${fadeDuration}ms ${easing}`,
            }}
        >
            {text}
        </span>
    );
};

export default AnimationText;
