<script lang="ts">
	import { page } from '$app/state';
	import FaultFolio from '$lib/components/FaultFolio.svelte';
	import Seo from '$lib/components/Seo.svelte';

	const status = $derived(page.status);
	const jammed = $derived(status >= 500);
	const title = $derived(jammed ? 'Porucha pultu' : 'Karta chýba');
	const description = $derived(
		jammed
			? 'Fond túto kartu teraz neotvorí. Skús znova, alebo sa vráť na sieň.'
			: 'Túto stránku sme v katalógu SPŠT nenašli.'
	);
</script>

<Seo {title} {description} index={false} />

<FaultFolio {status} message={page.error?.message} />
