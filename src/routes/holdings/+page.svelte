<script lang="ts">
	import FundLedger from '$lib/components/FundLedger.svelte';
	import Seo from '$lib/components/Seo.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<Seo
	title="Všetky knihy"
	description="Register školského fondu SPŠT podľa odborov — signatúra, autor a voľné výtlačky."
/>

<FundLedger books={data.books} categories={data.categories} />
