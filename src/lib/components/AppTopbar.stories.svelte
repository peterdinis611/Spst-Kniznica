<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AppTopbar from './AppTopbar.svelte';
	import { categories, sampleLibrarian, sampleReader } from '$lib/stories/fixtures';

	const chips = categories.map((category) => ({
		id: category.id,
		name: category.name,
		slug: category.slug,
		code: category.code,
		accent: category.accent,
		bookCount: category.bookCount
	}));

	const { Story } = defineMeta({
		title: 'Fond/AppTopbar',
		component: AppTopbar,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Hosť" asChild>
	<div class="min-h-[12rem]">
		<form id="logout-form" method="POST" action="/logout"></form>
		<AppTopbar user={null} categories={chips} />
	</div>
</Story>

<Story name="Čitateľ" asChild>
	<div class="min-h-[12rem]">
		<form id="logout-form" method="POST" action="/logout"></form>
		<AppTopbar user={sampleReader} categories={chips} />
	</div>
</Story>

<Story name="Knihovník" asChild>
	<div class="min-h-[12rem]">
		<form id="logout-form" method="POST" action="/logout"></form>
		<AppTopbar user={sampleLibrarian} categories={chips} admin />
	</div>
</Story>
