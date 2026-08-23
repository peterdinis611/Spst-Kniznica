<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { Input } from './index.js';
	import { Label } from '$lib/components/ui/label/index.js';

	const { Story } = defineMeta({
		title: 'UI/Input',
		component: Input,
		tags: ['autodocs']
	});
</script>

<Story name="Hľadanie" args={{ placeholder: 'Názov, autor alebo signatúra' }} />

<Story name="E-mail" args={{ type: 'email', placeholder: 'meno@spst.sk' }} />

<Story name="Heslo" args={{ type: 'password', placeholder: 'Heslo (8+)' }} />

<Story name="Neplatné" args={{ value: 'x', 'aria-invalid': true }} />

<Story name="S menovkou" asChild>
	<div class="grid w-72 gap-2">
		<Label for="signatura">Signatúra</Label>
		<Input id="signatura" placeholder="INF 004.4 ALG" />
	</div>
</Story>
