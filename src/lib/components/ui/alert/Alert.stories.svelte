<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Alert from './index.js';

	const { Story } = defineMeta({
		title: 'UI/Alert',
		component: Alert.Root,
		tags: ['autodocs']
	});
</script>

<Story name="Výtlačok" asChild>
	<Alert.Root class="w-[28rem]">
		<Alert.Title>Žiadny voľný výtlačok</Alert.Title>
		<Alert.Description>Kniha nie je stratená, len vonku. Skús neskôr.</Alert.Description>
	</Alert.Root>
</Story>

<Story name="Lehota" asChild>
	<Alert.Root variant="destructive" class="w-[28rem]">
		<Alert.Title>Po lehote</Alert.Title>
		<Alert.Description>Časti strojov mali byť v pavilóne B včera.</Alert.Description>
	</Alert.Root>
</Story>
