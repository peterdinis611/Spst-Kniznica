<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import OfflineSlip from './OfflineSlip.svelte';

	const { Story } = defineMeta({
		title: 'Fond/OfflineSlip',
		component: OfflineSlip,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Mimo sieť" args={{ preview: 'offline' }} />

<Story name="Späť" args={{ preview: 'restored' }} />
