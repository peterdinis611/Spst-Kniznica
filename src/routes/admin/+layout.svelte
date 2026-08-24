<script lang="ts">
	import '../admin.css';
	import PultNav from '$lib/components/PultNav.svelte';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<section class="pult">
	<header class="pult-mast">
		<p class="pult-kicker">pavilón B · kartotéka</p>
		<h1>Pult</h1>
		<p class="pult-lede">
			Správa fondu. Zásuvky sú vpredu na pulte — odbory, autori, zväzky, výtlačky a lístky.
		</p>
	</header>
	<div class="pult-cabinet">
		<PultNav />
		<div class="pult-sheet">
			{@render children()}
		</div>
	</div>
</section>
