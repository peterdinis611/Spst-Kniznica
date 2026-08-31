<script lang="ts">
	import '../admin.css';
	import PultNav from '$lib/components/PultNav.svelte';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<section class="pult">
	<header class="pult-mast">
		<p class="pult-kicker">pavilón B · kartotéka</p>
		<h1>Pult</h1>
		<p class="pult-lede">
			{#if data.desk.manage}
				Správa fondu. Zásuvky sú vpredu na pulte — odbory, autori, zväzky, výtlačky a lístky.
			{:else}
				Trieda vonku a oneskorené lístky. Fond nemeníš — to ostáva knihovníkovi.
			{/if}
		</p>
	</header>
	<div class="pult-cabinet">
		<PultNav manage={data.desk.manage} />
		<div class="pult-sheet">
			{@render children()}
		</div>
	</div>
</section>
