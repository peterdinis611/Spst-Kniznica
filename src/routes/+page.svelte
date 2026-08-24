<script lang="ts">
	import { resolve } from '$app/paths';
	import { booksLabel, initials } from '$lib/format';
	import { authorSwatch } from '$lib/cover';
	import CoverRail from '$lib/components/CoverRail.svelte';
	import FolioShelf from '$lib/components/FolioShelf.svelte';
	import HallChrome from '$lib/components/HallChrome.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const picks = $derived(data.books);
</script>

<Seo
	title="SPŠT knižnica"
	description="Školská knižnica SPŠT — katalóg učebníc, noriem a literatúry. Výpožička na 7, 14 alebo 21 dní, bez stropu na počet kníh. Pavilón B, Po—Pia 7:30—15:30."
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'Library',
		name: 'SPŠT knižnica',
		description:
			'Školský fond učebníc, noriem a povinnej literatúry pre žiakov a učiteľov SPŠT.',
		openingHours: 'Mo-Fr 07:30-15:30',
		address: {
			'@type': 'PostalAddress',
			streetAddress: 'Pavilón B',
			addressCountry: 'SK'
		}
	}}
/>

<HallChrome user={data.user} admin={data.admin} searchPreview={data.searchPreview}>
	<section class="folio">
		<h1>Učebnice a príbehy, ktoré SPŠT ešte nedočítalo.</h1>
		<p class="folio-lead">
			Na polici sú skutočné zväzky z fondu — {data.stats.available} voľných výtlačkov
			z {data.stats.books} kníh. Klikni na chrbát alebo menovku.
		</p>
		<a class="folio-cta no-underline" href={resolve('/discover')}>Vstúpiť do fondu</a>
		<FolioShelf books={data.shelf} />
	</section>

	<section class="folio-block" id="ako">
		<p class="folio-kicker">Ako to tu funguje</p>
		<h2>Tri kroky od police k výpožičke.</h2>
		<ol class="folio-steps">
			<li>
				<span>01</span>
				<h3>Nájdi vo fonde</h3>
				<p>Hľadaj podľa názvu, autora alebo signatúry. Voľné výtlačky uvidíš hneď.</p>
			</li>
			<li>
				<span>02</span>
				<h3>Požičaj na účet</h3>
				<p>Prihlás sa a vezmi toľko kníh, koľko potrebuješ. Lehotu 7, 14 alebo 21 dní vyberieš na lístku, bez poplatku.</p>
			</li>
			<li>
				<span>03</span>
				<h3>Vráť v pavilóne B</h3>
				<p>Odnes zväzok na 1. poschodie. Po—Pia 7:30—15:30.</p>
			</li>
		</ol>
	</section>

	<section class="folio-block">
		<div class="folio-head">
			<div>
				<p class="folio-kicker">Pracovné zväzky</p>
				<h2>Otoč policu a vyber knihu, ktorú otvoríš hneď.</h2>
			</div>
			<a class="folio-cta folio-cta-sm no-underline" href={resolve('/books')}>Celý katalóg</a>
		</div>
		<p class="folio-shelf-hint">
			Otoč zväzok šípami alebo ťahaním.
		</p>
		<CoverRail books={picks} />
	</section>

	<section class="folio-block">
		<div class="folio-head">
			<div>
				<p class="folio-kicker">Menný katalóg</p>
				<h2>Autori, ktorých držíme na polici.</h2>
			</div>
			<a class="folio-cta folio-cta-sm no-underline" href={resolve('/authors')}>Všetci autori</a>
		</div>
		<ul class="folio-authors">
			{#each data.authors as author (author.id)}
				<li>
					<a class="folio-author no-underline" href={resolve('/authors/[slug]', { slug: author.slug })}>
						<span class="folio-avatar" style="background: {authorSwatch(author.id)}">
							{initials(author.name)}
						</span>
						<span>
							<strong>{author.name}</strong>
							<em>{booksLabel(author.bookCount)}</em>
						</span>
					</a>
				</li>
			{/each}
		</ul>
	</section>

	<section class="folio-close">
		<div>
			<p class="folio-kicker">Čitateľský účet</p>
			<h2>
				{#if data.user}
					Máš účet. Kniha je tvoja na lehotu z lístka.
				{:else}
					Prihlás sa a kniha je tvoja na 7, 14 alebo 21 dní.
				{/if}
			</h2>
		</div>
		<div class="folio-close-actions">
			{#if data.user}
				<a class="folio-cta no-underline" href={resolve('/loans')}>Moje výpožičky</a>
			{:else}
				<a class="folio-cta no-underline" href={resolve('/login')}>Prihlásiť sa</a>
			{/if}
			<a class="folio-ghost no-underline" href={resolve('/discover')}>Prezrieť fond</a>
		</div>
	</section>
</HallChrome>
