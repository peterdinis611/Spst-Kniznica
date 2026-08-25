<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AppSidebar from './AppSidebar.svelte';
	import { sampleLibrarian, sampleReader } from '$lib/stories/fixtures';

	const { Story } = defineMeta({
		title: 'Fond/AppSidebar',
		component: AppSidebar,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Hosť" asChild>
	<div class="bg-sidebar h-dvh w-[16rem]">
		<AppSidebar user={null} />
	</div>
</Story>

<Story name="Čitateľ" asChild>
	<div class="bg-sidebar h-dvh w-[16rem]">
		<AppSidebar user={sampleReader} />
	</div>
</Story>

<Story name="Knihovník" asChild>
	<div class="bg-sidebar h-dvh w-[16rem]">
		<form id="logout-form" method="POST" action="/logout"></form>
		<AppSidebar user={sampleLibrarian} />
	</div>
</Story>

<Story name="Kompaktná" asChild>
	<div class="bg-sidebar h-dvh w-[16rem]">
		<AppSidebar user={sampleReader} compact />
	</div>
</Story>
