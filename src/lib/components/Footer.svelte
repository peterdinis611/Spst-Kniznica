<script lang="ts">
	import { resolve } from '$app/paths';

	let { tone = 'desk' }: { tone?: 'desk' | 'hall' } = $props();

	const year = new Date().getFullYear();
	const links = [
		{ href: resolve('/discover'), label: 'Objavovať' },
		{ href: resolve('/holdings'), label: 'Všetky knihy' },
		{ href: resolve('/books'), label: 'Katalóg' },
		{ href: resolve('/departments'), label: 'Odbory' },
		{ href: resolve('/authors'), label: 'Autori' },
		{ href: resolve('/docs'), label: 'Príručka' }
	] as const;
</script>

<footer class={tone === 'hall' ? 'hall-foot' : 'desk-foot'}>
	{#if tone === 'hall'}
		<p class="hall-kicker">Pavilón B · 1. poschodie</p>
		<p class="hall-foot-brand">SPŠT knižnica</p>
		<p class="hall-foot-lead">
			Školský fond učebníc, noriem a literatúry. 21 dní, bez stropu na počet kníh. Po—Pia 7:30—15:30.
		</p>
		<nav aria-label="Pätička">
			{#each links as link (link.href)}
				<a href={link.href}>{link.label}</a>
			{/each}
		</nav>
		<p class="hall-foot-copy">© {year} SPŠT knižnica · interný školský fond</p>
	{:else}
		<p>SPŠT knižnica · pavilón B · Po—Pia 7:30—15:30</p>
		<nav aria-label="Pätička">
			{#each links as link (link.href)}
				<a href={link.href}>{link.label}</a>
			{/each}
		</nav>
	{/if}
</footer>

<style>
	.desk-foot {
		display: grid;
		justify-items: center;
		gap: 0.7rem;
		margin-top: 2.8rem;
		padding: 1.6rem 0 0.4rem;
		border-top: 1px solid var(--border);
		color: var(--muted-foreground);
		font-size: 0.82rem;
		text-align: center;
	}

	.desk-foot nav {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.45rem 1.15rem;
	}

	.desk-foot a {
		color: inherit;
		text-decoration: none;
	}

	.desk-foot a:hover {
		color: var(--foreground);
	}
</style>
