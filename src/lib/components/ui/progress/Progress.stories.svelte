<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Progress } from './index.js';

	const { Story } = defineMeta({
		title: 'UI/Progress',
		component: Progress,
		tags: ['autodocs']
	});
</script>

<Story name="Jedna z piatich" args={{ value: 20, max: 100 }} />

<Story name="Plná skrinka" args={{ value: 100, max: 100 }} />

<Story name="Limity" asChild>
	<div class="grid w-72 gap-4">
		<p class="text-muted-foreground text-sm">1 / 5 kníh</p>
		<Progress value={20} />
		<p class="text-muted-foreground text-sm">5 / 5 kníh</p>
		<Progress value={100} />
	</div>
</Story>
