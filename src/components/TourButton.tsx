'use client';

import { CircleHelp } from 'lucide-react';

export function TourButton() {
	return (
		<button
			type="button"
			className="mb-1 flex h-auto items-center gap-2 rounded-full px-3 py-1.5 font-normal text-muted-foreground"
			onClick={async () => {
				const { startTour, markTourSeen } = await import('@/tour');
				await startTour(markTourSeen);
			}}
		>
			<CircleHelp className="size-4" />
			Prehliadka
		</button>
	);
}
