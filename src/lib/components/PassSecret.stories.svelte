<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AuthPass from './AuthPass.svelte';
	import PassSecret from './PassSecret.svelte';

	const { Story } = defineMeta({
		title: 'Fond/PassSecret',
		component: PassSecret,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Sila" asChild>
	<AuthPass
		kicker="Nové heslo"
		title="Nový odtlačok."
		lede="Zadaj heslo dvakrát — písmeno, číslica, aspoň osem znakov."
		serial="NOVÉ HESLO · 8+"
		facts={['aspoň 8 znakov', 'dvakrát rovnaké', 'potom Moje knihy']}
	>
		<form class="pass-form">
			<PassSecret
				id="sb-password"
				label="Nové heslo"
				autocomplete="new-password"
				value="kniha-pult-12"
				meter
			/>
			<PassSecret
				id="sb-confirm"
				name="confirm"
				label="Heslo znova"
				autocomplete="new-password"
				value="kniha-pult-12"
			/>
			<button class="pass-go" type="button">Uložiť heslo</button>
		</form>
	</AuthPass>
</Story>

<Story name="Chyba" asChild>
	<AuthPass kicker="Čitateľský účet" title="Polož preukaz." lede="E-mail a heslo.">
		<form class="pass-form">
			<PassSecret
				id="sb-bad"
				label="Heslo"
				autocomplete="current-password"
				value="abc"
				error="Heslo musí mať aspoň 8 znakov."
			/>
		</form>
	</AuthPass>
</Story>
