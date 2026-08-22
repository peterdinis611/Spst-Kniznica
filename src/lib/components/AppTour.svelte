<script lang="ts">
	import { page } from '$app/state';
	import { hasSeenTour, markTourSeen, startTour } from '$lib/tour';

	const isHall = $derived(page.route.id === '/');
	const force = $derived(page.url.searchParams.get('tour') === '1');

	$effect(() => {
		if (isHall) return;
		const onDiscover = page.url.pathname === '/discover';
		const shouldStart = force || (onDiscover && !hasSeenTour());
		if (!shouldStart) return;

		const timer = window.setTimeout(() => {
			startTour(markTourSeen);
			if (force) {
				const url = new URL(page.url);
				url.searchParams.delete('tour');
				history.replaceState(history.state, '', url);
			}
		}, 720);

		return () => window.clearTimeout(timer);
	});
</script>
