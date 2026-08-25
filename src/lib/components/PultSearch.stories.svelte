<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PultSearch from './PultSearch.svelte';
	import '../../routes/admin.css';

	const { Story } = defineMeta({
		title: 'Pult/PultSearch',
		component: PultSearch,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen',
			sveltekit_experimental: {
				state: {
					page: {
						url: new URL('https://kniznica.local/admin/books?q=algorit'),
						route: { id: '/admin/books' },
						status: 200
					}
				}
			}
		}
	});
</script>

<Story name="Hľadám" asChild>
	<div class="p-6">
		<PultSearch query="algorit" placeholder="hľadať v zásuvke kníh" />
	</div>
</Story>
