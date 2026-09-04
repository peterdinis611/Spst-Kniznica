'use client';

import { useState } from 'react';
import { cn } from '@/utils/cn';
import { imagePreset, photoSrcSet, photoUrl, type ImagePreset } from '@/catalog/cover';
import './optimized-image.css';

export function OptimizedImage({
	src,
	alt = '',
	preset = 'rail',
	eager = false,
	className = '',
	fallbackLabel = '',
	fallbackBg = '#2a1c16',
	fallbackFg = '#f6efe4'
}: {
	src: string;
	alt?: string;
	preset?: ImagePreset;
	eager?: boolean;
	className?: string;
	fallbackLabel?: string;
	fallbackBg?: string;
	fallbackFg?: string;
}) {
	const [failed, setFailed] = useState(false);
	const [loaded, setLoaded] = useState(false);
	const spec = imagePreset(preset);
	const srcset = photoSrcSet(src, spec.widths, { width: spec.width, height: spec.height });
	const primary = photoUrl(src, spec.width, spec.height);

	return (
		<div
			className={cn('opt-image', className)}
			style={
				{
					'--opt-bg': fallbackBg,
					'--opt-fg': fallbackFg,
					aspectRatio: `${spec.width} / ${spec.height}`
				} as React.CSSProperties
			}
			data-loaded={loaded}
			data-failed={failed}
		>
			{failed ? (
				<div className="opt-fallback" role="img" aria-label={alt || fallbackLabel}>
					<span>{fallbackLabel || 'Obálka chýba'}</span>
				</div>
			) : (
				<img
					src={primary}
					srcSet={srcset}
					sizes={spec.sizes}
					alt={alt}
					width={spec.width}
					height={spec.height}
					loading={eager ? 'eager' : 'lazy'}
					decoding="async"
					fetchPriority={eager ? 'high' : 'low'}
					referrerPolicy="no-referrer"
					className={loaded ? 'is-ready' : undefined}
					onLoad={() => setLoaded(true)}
					onError={() => setFailed(true)}
				/>
			)}
		</div>
	);
}
