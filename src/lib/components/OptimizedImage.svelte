<script lang="ts">
	import { cn } from '$lib/utils.js';
	import { imagePreset, photoSrcSet, photoUrl, type ImagePreset } from '$lib/cover';

	let {
		src,
		alt = '',
		preset = 'rail',
		eager = false,
		class: className = '',
		fallbackLabel = '',
		fallbackBg = '#1b3d32',
		fallbackFg = '#f8f1e3'
	}: {
		src: string;
		alt?: string;
		preset?: ImagePreset;
		eager?: boolean;
		class?: string;
		fallbackLabel?: string;
		fallbackBg?: string;
		fallbackFg?: string;
	} = $props();

	let failed = $state(false);
	let loaded = $state(false);

	const spec = $derived(imagePreset(preset));
	const srcset = $derived(
		photoSrcSet(src, spec.widths, { width: spec.width, height: spec.height })
	);
	const primary = $derived(photoUrl(src, spec.width, spec.height));

	$effect.pre(() => {
		src;
		failed = false;
		loaded = false;
	});
</script>

<div
	class={cn('opt-image', className)}
	style="--opt-bg: {fallbackBg}; --opt-fg: {fallbackFg}; aspect-ratio: {spec.width} / {spec.height}"
	data-loaded={loaded}
	data-failed={failed}
>
	{#if failed}
		<div class="opt-fallback" role="img" aria-label={alt || fallbackLabel}>
			<span>{fallbackLabel || 'Obálka chýba'}</span>
		</div>
	{:else}
		<img
			src={primary}
			{srcset}
			sizes={spec.sizes}
			{alt}
			width={spec.width}
			height={spec.height}
			loading={eager ? 'eager' : 'lazy'}
			decoding="async"
			fetchpriority={eager ? 'high' : 'low'}
			referrerpolicy="no-referrer"
			class:is-ready={loaded}
			onload={() => (loaded = true)}
			onerror={() => (failed = true)}
		/>
	{/if}
</div>

<style>
	.opt-image {
		overflow: hidden;
		background:
			linear-gradient(180deg, rgb(255 255 255 / 0.08), transparent 42%),
			var(--opt-bg, #1b3d32);
	}

	.opt-image img {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.45s ease;
	}

	.opt-image img.is-ready {
		opacity: 1;
	}

	.opt-fallback {
		display: grid;
		place-items: end start;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		padding: 0.7rem 0.65rem;
		background:
			repeating-linear-gradient(
				-18deg,
				transparent,
				transparent 11px,
				rgb(255 255 255 / 0.05) 11px,
				rgb(255 255 255 / 0.05) 12px
			),
			linear-gradient(165deg, rgb(255 255 255 / 0.1), transparent 46%),
			var(--opt-bg, #1b3d32);
		color: var(--opt-fg, #f8f1e3);
	}

	.opt-fallback span {
		display: -webkit-box;
		overflow: hidden;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 4;
		line-clamp: 4;
		font-size: 0.72rem;
		font-weight: 700;
		line-height: 1.2;
		letter-spacing: -0.02em;
	}

	@media (prefers-reduced-motion: reduce) {
		.opt-image img {
			opacity: 1;
			transition: none;
		}
	}
</style>
