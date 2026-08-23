<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Tabs from './index.js';

	const { Story } = defineMeta({
		title: 'UI/Tabs',
		component: Tabs.Root,
		tags: ['autodocs']
	});
</script>

<Story name="Fond" asChild>
	<Tabs.Root value="katalog" class="w-[28rem]">
		<Tabs.List>
			<Tabs.Trigger value="katalog">Katalóg</Tabs.Trigger>
			<Tabs.Trigger value="loans">Moje knihy</Tabs.Trigger>
			<Tabs.Trigger value="docs">Príručka</Tabs.Trigger>
		</Tabs.List>
		<Tabs.Content value="katalog" class="pt-3 text-sm">Celý školský fond učebníc.</Tabs.Content>
		<Tabs.Content value="loans" class="pt-3 text-sm">Aktívne výpožičky na 21 dní.</Tabs.Content>
		<Tabs.Content value="docs" class="pt-3 text-sm">Ako sa požičiava a vracia.</Tabs.Content>
	</Tabs.Root>
</Story>
