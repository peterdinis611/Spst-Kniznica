<script lang="ts">
	import * as Card from '$lib/components/ui/card/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
</script>

<footer class="mt-auto pt-10 pb-8">
	<div class="wrap">
		<Card.Root>
			<Card.Content class="flex flex-col gap-4 py-6 md:flex-row md:items-end md:justify-between">
				<div>
					<Card.Title class="text-2xl">Študovňa je otvorená</Card.Title>
					<Card.Description class="mt-2">
						Pavilón B · Po—Pia 7:30—15:30 · 21 dní · max 5 kníh
					</Card.Description>
				</div>
				<Separator class="md:hidden" />
				<p class="text-muted-foreground text-sm">SPŠT knižnica · žiaci a učitelia</p>
			</Card.Content>
		</Card.Root>
	</div>
</footer>
