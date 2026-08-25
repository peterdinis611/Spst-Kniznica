<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import PultNav from './PultNav.svelte';
	import '../../routes/admin.css';

	const { Story } = defineMeta({
		title: 'Pult/PultNav',
		component: PultNav,
		tags: ['autodocs'],
		parameters: {
			layout: 'fullscreen',
			sveltekit_experimental: {
				state: {
					page: {
						url: new URL('https://kniznica.local/admin/departments'),
						route: { id: '/admin/departments' },
						status: 200
					}
				}
			}
		}
	});
</script>

<Story name="Kartotéka" asChild>
	<div class="p-6">
		<PultNav />
	</div>
</Story>
