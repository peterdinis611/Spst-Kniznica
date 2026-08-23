<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import * as Breadcrumb from './index.js';

	const { Story } = defineMeta({
		title: 'UI/Breadcrumb',
		component: Breadcrumb.Root,
		tags: ['autodocs']
	});
</script>

<Story name="Kniha" asChild>
	<Breadcrumb.Root>
		<Breadcrumb.List>
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/books">Katalóg</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/departments/informatika">Informatika</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
			<Breadcrumb.Item>
				<Breadcrumb.Page>Algoritmy v dielni</Breadcrumb.Page>
			</Breadcrumb.Item>
		</Breadcrumb.List>
	</Breadcrumb.Root>
</Story>
