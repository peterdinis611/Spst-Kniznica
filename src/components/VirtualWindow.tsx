'use client';

import { useWindowVirtualizer } from '@tanstack/react-virtual';
import type { ReactNode } from 'react';
import './virtual-window.css';

export function VirtualWindow({
	count,
	estimateSize,
	overscan = 12,
	children
}: {
	count: number;
	estimateSize: (index: number) => number;
	overscan?: number;
	children: (index: number) => ReactNode;
}) {
	const virtualizer = useWindowVirtualizer({
		count,
		estimateSize,
		overscan
	});
	const rows = virtualizer.getVirtualItems();
	const total = virtualizer.getTotalSize() || rows.at(-1)?.end || 0;

	return (
		<div className="virtual-window" style={{ height: total }}>
			{rows.map((row) => (
				<div
					key={row.key}
					className="virtual-row"
					style={{ height: row.size, transform: `translateY(${row.start}px)` }}
				>
					{children(row.index)}
				</div>
			))}
		</div>
	);
}
