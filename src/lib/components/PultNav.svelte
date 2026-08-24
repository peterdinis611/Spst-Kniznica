<script lang="ts">
	import { page } from '$app/state';
	import { PULT_TABLES } from '$lib/admin';

	function on(path: string) {
		if (path === '/admin') return page.url.pathname === '/admin' || page.url.pathname === '/admin/';
		return page.url.pathname.startsWith(path);
	}
</script>

<nav class="pult-tabs" aria-label="Kartotéka pultu">
	{#each PULT_TABLES as item, i (item.href)}
		<a class="pult-tab" class:is-on={on(item.href)} href={item.href} style="animation-delay: {i * 40}ms">
			<em>{item.code}</em>
			{item.label}
		</a>
	{/each}
</nav>
