<script lang="ts">
	export type StampTone = 'borrowed' | 'returned' | 'overdue';

	let {
		label,
		sub,
		tone,
		persist = false
	}: {
		label: string;
		sub?: string;
		tone?: StampTone;
		persist?: boolean;
	} = $props();

	const resolved = $derived(tone ?? toneFromLabel(label));

	function toneFromLabel(value: string): StampTone {
		const key = value
			.normalize('NFD')
			.replace(/\p{M}/gu, '')
			.toLowerCase();
		if (key.includes('nevratene')) return 'overdue';
		if (key.includes('vratene')) return 'returned';
		return 'borrowed';
	}
</script>

<div class="burst" class:persist data-tone={resolved} aria-live="polite">
	<div class="lock-seal">
		{label}
		{#if sub}
			<span class="mt-1 block font-mono text-[0.7rem] font-semibold tracking-[0.08em]">{sub}</span>
		{/if}
	</div>
</div>

<style>
	.burst {
		--seal: #1e6b3c;
		--seal-ink: #eef6e8;
		--wash: rgb(14 48 28 / 0.4);
		position: fixed;
		inset: 0;
		z-index: 90;
		display: grid;
		place-items: center;
		pointer-events: none;
		background: var(--wash);
		animation: fade-out 1.5s ease forwards;
	}

	.burst[data-tone='returned'] {
		--seal: #2a4d6e;
		--seal-ink: #eef3f8;
		--wash: rgb(16 32 52 / 0.42);
	}

	.burst[data-tone='overdue'] {
		--seal: #c43a2a;
		--seal-ink: #fff4ef;
		--wash: rgb(58 14 10 / 0.44);
	}

	.burst.persist {
		animation: none;
	}

	.lock-seal {
		position: relative;
		display: grid;
		place-items: center;
		width: 11rem;
		height: 11rem;
		padding: 1rem;
		border-radius: 999px;
		background:
			radial-gradient(circle at 30% 24%, rgb(255 255 255 / 0.18), transparent 46%),
			var(--seal);
		color: var(--seal-ink);
		text-align: center;
		font-weight: 800;
		letter-spacing: 0.04em;
		box-shadow:
			0 0 0 6px color-mix(in srgb, var(--seal-ink) 22%, transparent),
			0 18px 40px rgb(40 28 16 / 0.28);
		animation: slam 0.55s cubic-bezier(0.2, 1.2, 0.3, 1) both;
	}

	.lock-seal::after {
		content: '';
		position: absolute;
		inset: 0.7rem;
		border-radius: 999px;
		border: 2px dashed color-mix(in srgb, var(--seal-ink) 55%, transparent);
		pointer-events: none;
	}

	:global(.dark) .burst[data-tone='borrowed'] {
		--seal: #2f8a4f;
		--seal-ink: #0f2416;
		--wash: rgb(10 28 18 / 0.55);
	}

	:global(.dark) .burst[data-tone='returned'] {
		--seal: #4d7aa3;
		--seal-ink: #0e1a28;
		--wash: rgb(10 16 28 / 0.55);
	}

	:global(.dark) .burst[data-tone='overdue'] {
		--seal: #e25a48;
		--seal-ink: #2a0c08;
		--wash: rgb(28 8 6 / 0.58);
	}

	@keyframes slam {
		from {
			opacity: 0;
			transform: scale(1.6) rotate(-12deg);
		}
		to {
			opacity: 1;
			transform: scale(1) rotate(-4deg);
		}
	}

	@keyframes fade-out {
		0%,
		55% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}
</style>
