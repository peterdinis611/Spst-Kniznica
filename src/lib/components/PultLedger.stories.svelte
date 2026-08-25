<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PultLedger from './PultLedger.svelte';
	import { pultLedgerColumns, pultLedgerRows } from '$lib/stories/fixtures';
	import '../../routes/admin.css';

	const { Story } = defineMeta({
		title: 'Pult/PultLedger',
		component: PultLedger,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Zásuvka" args={{ rows: pultLedgerRows, columns: pultLedgerColumns, empty: 'prázdne' }} />
