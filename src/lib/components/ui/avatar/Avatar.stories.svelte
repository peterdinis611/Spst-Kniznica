<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Avatar from './index.js';

	const { Story } = defineMeta({
		title: 'UI/Avatar',
		component: Avatar.Root,
		tags: ['autodocs']
	});
</script>

<Story name="Iniciály" asChild>
	<Avatar.Root>
		<Avatar.Fallback>MK</Avatar.Fallback>
	</Avatar.Root>
</Story>

<Story name="Veľkosti" asChild>
	<div class="flex items-end gap-3">
		<Avatar.Root size="sm"><Avatar.Fallback>MK</Avatar.Fallback></Avatar.Root>
		<Avatar.Root><Avatar.Fallback>MK</Avatar.Fallback></Avatar.Root>
		<Avatar.Root size="lg"><Avatar.Fallback>MK</Avatar.Fallback></Avatar.Root>
	</div>
</Story>

<Story name="Skupina" asChild>
	<Avatar.Group>
		<Avatar.Root><Avatar.Fallback>JB</Avatar.Fallback></Avatar.Root>
		<Avatar.Root><Avatar.Fallback>EK</Avatar.Fallback></Avatar.Root>
		<Avatar.Root><Avatar.Fallback>AN</Avatar.Fallback></Avatar.Root>
		<Avatar.GroupCount>+4</Avatar.GroupCount>
	</Avatar.Group>
</Story>
