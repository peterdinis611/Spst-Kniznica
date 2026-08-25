<script lang="ts">
	import { resolve } from '$app/paths';
	import Seo from '$lib/components/Seo.svelte';
	import AuthPass from '$lib/components/AuthPass.svelte';
</script>

<Seo
	title="Odkaz z e-mailu"
	description="Odkaz na potvrdenie účtu alebo obnovu hesla je neplatný alebo vypršal."
	index={false}
/>

<AuthPass
	kicker="E-mailový odkaz"
	title="Odtlačok vypršal."
	lede="Buď vypršal, alebo sa už použil. Požiadaj o nový z prihlásenia, alebo si znova pošli obnovu hesla."
	serial="NEPLATNÝ · TOKEN"
	facts={['odkaz jednorazový', 'platnosť krátka']}
>
	<div class="pass-actions">
		<a class="is-ink" href={resolve('/login')}>Prihlásenie</a>
		<a href={resolve('/login/recovery')}>Zabudnuté heslo</a>
	</div>
</AuthPass>
