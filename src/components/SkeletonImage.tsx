import React from 'react'
import { Image, Skeleton } from 'antd'
import type { ComponentProps } from '../core/Renderer';

export interface SkeletonImageProps extends ComponentProps {
    src?: string;
    alt?: string;
    width?: string | number;
    height?: string | number;
    preview?: boolean;
    objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
    'data-stream-status'?: 'loading' | 'done';
    /** 自定义加载组件，不传则使用默认骨架屏 */
    loading?: React.ReactNode;
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
    src, alt = '', width, height, streamStatus, preview = true, objectFit = 'contain', 'data-stream-status': dataStatus, loading: customLoading,
}) => {
    const w = typeof width === 'number' ? width : parseInt(width || '100', 10);
    const h = typeof height === 'number' ? height : parseInt(height || '100', 10);
    const loading = streamStatus === 'loading' || dataStatus === 'loading';

    // 默认骨架屏
    const defaultSkeleton = <Skeleton.Image active style={{ width: w, height: h }} />;

    if (loading || !src) {
        return <>{customLoading || defaultSkeleton}</>;
    }

    return <Image src={src} alt={alt} width={w} height={h} preview={preview} style={{ objectFit, borderRadius: 8 }} placeholder={customLoading || defaultSkeleton} />;
};

export default SkeletonImage;