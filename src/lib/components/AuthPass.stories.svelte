<script module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import AuthPass from './AuthPass.svelte';

	const { Story } = defineMeta({
		title: 'Fond/AuthPass',
		component: AuthPass,
		tags: ['autodocs'],
		parameters: { layout: 'fullscreen' }
	});
</script>

<Story name="Prihlásenie" asChild>
	<AuthPass
		kicker="Čitateľský účet"
		title="Polož preukaz."
		lede="E-mail a heslo. Potom môžeš brať knihy — 7, 14 alebo 21 dní."
		serial="PREUKAZ · PAV. B · 7–21 D"
	>
		{#snippet tabs()}
			<a href="/login" class="is-on">Mám účet</a>
			<a href="/login?mod=novy">Som nový</a>
		{/snippet}
		<form class="pass-form">
			<div class="pass-field">
				<label for="sb-email">E-mail</label>
				<input id="sb-email" value="maria.kovacova@spst.sk" readonly />
			</div>
			<div class="pass-field">
				<label for="sb-heslo">Heslo</label>
				<input id="sb-heslo" type="password" value="••••••••" readonly />
			</div>
			<p class="pass-help"><a href="/login/recovery">Zabudnuté heslo?</a></p>
			<button class="pass-go" type="button">Prihlásiť sa</button>
		</form>
	</AuthPass>
</Story>

<Story name="Nový preukaz" asChild>
	<AuthPass
		kicker="Čitateľský účet"
		title="Nový preukaz."
		lede="Meno, e-mail, heslo. Ak fond potvrdzuje e-mail, najprv otvor odkaz v správe."
		serial="NOVÝ · PREUKAZ · SPŠT"
	>
		{#snippet tabs()}
			<a href="/login">Mám účet</a>
			<a href="/login?mod=novy" class="is-on">Som nový</a>
		{/snippet}
		<form class="pass-form">
			<div class="pass-field">
				<label for="sb-name">Meno</label>
				<input id="sb-name" value="Mária Kováčová" readonly />
			</div>
			<p class="pass-note is-ok">Skontroluj e-mail a potvrď účet. Potom sa môžeš prihlásiť.</p>
			<a class="pass-back" href="/login">Späť na prihlásenie</a>
		</form>
	</AuthPass>
</Story>
