<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { createUploadThing } from '$lib/uploadthing';

	let {
		url = '',
		fileKey = '',
		ready = false
	}: {
		url?: string | null;
		fileKey?: string | null;
		ready?: boolean;
	} = $props();

	let coverUrl = $state(url?.trim() ?? '');
	let coverKey = $state(fileKey?.trim() ?? '');
	let pending = $state(false);
	let fault = $state('');
	let hovering = $state(false);
	let picker: HTMLInputElement | undefined = $state();

	const { startUpload, isUploading } = createUploadThing('bookCover', {
		onUploadError: (error) => {
			pending = false;
			fault = error.message || 'Obálka sa nenahrala.';
		}
	});

	const busy = $derived(pending || $isUploading);

	async function takeFiles(list: FileList | File[] | null) {
		const file = list?.[0];
		if (!file || busy || !ready) return;
		if (!file.type.startsWith('image/')) {
			fault = 'Obálka musí byť obrázok.';
			return;
		}
		if (file.size > 4 * 1024 * 1024) {
			fault = 'Snímka je väčšia ako 4 MB.';
			return;
		}

		fault = '';
		pending = true;
		const uploaded = await startUpload([file]);
		pending = false;
		if (picker) picker.value = '';
		const first = uploaded?.[0];
		if (!first) return;
		coverUrl = first.ufsUrl;
		coverKey = first.key;
	}

	function clearCover() {
		coverUrl = '';
		coverKey = '';
		fault = '';
		if (picker) picker.value = '';
	}
</script>

<input type="hidden" name="coverUrl" value={coverUrl} />
<input type="hidden" name="coverKey" value={coverKey} />

<div
	class="pult-jacket"
	class:is-hot={hovering}
	class:is-busy={busy}
	aria-label="Obálka zväzku"
	ondragenter={(event) => {
		event.preventDefault();
		if (ready && !busy) hovering = true;
	}}
	ondragover={(event) => {
		event.preventDefault();
		if (ready && !busy) hovering = true;
	}}
	ondragleave={() => (hovering = false)}
	ondrop={(event) => {
		event.preventDefault();
		hovering = false;
		void takeFiles(event.dataTransfer?.files ?? null);
	}}
>
	<div class="pult-jacket-face" aria-hidden="true">
		{#if coverUrl}
			<img src={coverUrl} alt="" />
		{:else}
			<span>bez<br />snímky</span>
		{/if}
	</div>
	<div class="pult-jacket-copy">
		{#if ready}
			<p>{busy ? 'Ide na policu…' : 'JPEG, PNG alebo WebP, do 4 MB. Polož snímku na lístok.'}</p>
			<div class="pult-jacket-actions">
				<input
					bind:this={picker}
					class="pult-jacket-file"
					type="file"
					accept="image/jpeg,image/png,image/webp"
					disabled={busy}
					onchange={(event) => void takeFiles(event.currentTarget.files)}
				/>
				<Button type="button" size="sm" variant="outline" disabled={busy} onclick={() => picker?.click()}>
					{coverUrl ? 'Vymeniť snímku' : 'Vložiť snímku'}
				</Button>
				{#if coverUrl}
					<Button type="button" size="sm" variant="ghost" disabled={busy} onclick={clearCover}>
						Sňať obálku
					</Button>
				{/if}
			</div>
		{:else}
			<p>Doplň <code>UPLOADTHING_TOKEN</code> v <code>.env</code>, potom obálku vložíš sem.</p>
		{/if}
		{#if fault}
			<p class="pult-jacket-fault" role="alert">{fault}</p>
		{/if}
	</div>
</div>
