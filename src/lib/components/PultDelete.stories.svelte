<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PultDelete from './PultDelete.svelte';
	import '../../routes/admin.css';

	const { Story } = defineMeta({
		title: 'Pult/PultDelete',
		component: PultDelete,
		tags: ['autodocs']
	});
</script>

<Story name="Pečiatka" args={{ fields: { id: 'cat-inf' }, ask: 'Zmazať odbor Informatika?', label: 'Zmazať' }} />
