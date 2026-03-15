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
}

export const SkeletonImage: React.FC<SkeletonImageProps> = ({
    src, alt = '', width, height, streamStatus, preview = true, objectFit = 'contain', 'data-stream-status': dataStatus,
}) => {
    const w = typeof width === 'number' ? width : parseInt(width || '400', 10);
    const h = typeof height === 'number' ? height : parseInt(height || '200', 10);
    const loading = streamStatus === 'loading' || dataStatus === 'loading';
    if (loading || !src) return <Skeleton.Image active style={{ width: w, height: h }} />;
    return <Image src={src} alt={alt} width={w} height={h} preview={preview} style={{ objectFit, borderRadius: 8 }} placeholder={<Skeleton.Image active style={{ width: w, height: h }} />} />;
};

export default SkeletonImage;