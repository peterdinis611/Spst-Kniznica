import Link from 'next/link';
import { authorLine } from '@/utils/format';
import { authorLast, clothFor } from '@/catalog/cover';
import { cn } from '@/utils/cn';
import type { BookSlip } from '@/types';

export function PrintJacket({
	book,
	size = 'shelf',
	linked = true,
	height,
	className
}: {
	book: BookSlip;
	size?: 'feature' | 'shelf' | 'thumb';
	linked?: boolean;
	height?: string;
	className?: string;
}) {
	const cloth = clothFor(book.id);
	const href = `/books/${book.id}`;
	const author = authorLast(authorLine(book.authors));
	const classes = cn(
		'relative block overflow-hidden rounded-[0.7rem] no-underline shadow-[5px_8px_0_rgb(60_42_33/0.12)] dark:shadow-[5px_8px_0_rgb(0_0_0/0.35)]',
		size === 'feature' && 'h-[13.4rem] w-[9rem] sm:h-[18rem] sm:w-[12.2rem]',
		size === 'shelf' && 'w-[6.8rem] sm:w-[8.6rem]',
		size === 'shelf' && !height && 'h-[10.8rem] sm:h-[13.4rem]',
		size === 'thumb' &&
			'h-[8.4rem] w-[5.4rem] rounded-[0.45rem] shadow-[5px_10px_0_rgb(40_28_16/0.16)] dark:shadow-[5px_10px_0_rgb(0_0_0/0.4)]',
		className
	);
	const style = {
		background: cloth.bg,
		color: cloth.ink,
		height: height || undefined
	} as React.CSSProperties;

	const inner = (
		<>
			<span
				className="pointer-events-none absolute inset-0 opacity-40"
				style={{
					background:
						'linear-gradient(90deg, rgb(0 0 0 / 0.18), transparent 28%, rgb(255 255 255 / 0.16) 72%, rgb(0 0 0 / 0.08))'
				}}
			/>
			<span
				className="absolute top-[30%] right-0 left-0 h-[3px]"
				style={{ background: cloth.band }}
			/>
			<div
				className={cn(
					'relative flex h-full flex-col justify-between',
					size === 'thumb' ? 'p-2' : 'p-3.5'
				)}
			>
				<span
					className={cn(
						'font-mono font-semibold tracking-[0.14em] uppercase opacity-70',
						size === 'thumb' ? 'text-[0.5rem]' : 'text-[0.62rem]'
					)}
				>
					{book.category.code}
				</span>
				<div>
					<p
						className={cn(
							'font-display leading-[1.12] font-semibold tracking-[-0.03em]',
							size === 'feature' && 'text-[1.35rem]',
							size === 'shelf' && 'text-[1.02rem]',
							size === 'thumb' && 'line-clamp-3 text-[0.72rem]'
						)}
					>
						{book.title}
					</p>
					<p
						className={cn(
							'font-sans font-semibold tracking-[0.12em] uppercase opacity-70',
							size === 'thumb' ? 'mt-1 text-[0.48rem]' : 'mt-2 text-[0.62rem]'
						)}
					>
						{author}
					</p>
				</div>
			</div>
		</>
	);

	if (linked) {
		return (
			<Link
				href={href}
				prefetch
				className={classes}
				style={style}
				title={`${book.title} — ${authorLine(book.authors)}`}
			>
				{inner}
			</Link>
		);
	}

	return (
		<div className={classes} style={style} title={`${book.title} — ${authorLine(book.authors)}`}>
			{inner}
		</div>
	);
}
