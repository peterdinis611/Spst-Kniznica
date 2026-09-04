import { authorLine } from '@/utils/format';
import { authorLast, jacketFor } from '@/catalog/cover';
import { cn } from '@/utils/cn';
import type { BookSlip } from '@/types';
import { OptimizedImage } from './OptimizedImage';

const sizes = {
	rail: 'h-[16.8rem] w-[11.2rem] md:h-[18.4rem] md:w-[12.2rem]',
	tile: 'aspect-[2/3] w-full',
	thumb: 'h-[6.6rem] w-[4.5rem]',
	hero: 'h-[17.4rem] w-[11.6rem] sm:h-[22rem] sm:w-[14.8rem]'
};

export function BookCover({
	book,
	size = 'rail',
	linked = true,
	plain = false
}: {
	book: BookSlip;
	size?: 'rail' | 'tile' | 'thumb' | 'hero';
	linked?: boolean;
	plain?: boolean;
}) {
	const tone = jacketFor(book);
	const href = `/books/${book.id}`;
	const author = authorLast(authorLine(book.authors));
	const className = cn('jacket', sizes[size]);
	const style = { background: tone.bg };
	const inner = (
		<>
			<OptimizedImage
				src={tone.photo}
				preset={size === 'hero' ? 'hero' : size === 'thumb' ? 'thumb' : size === 'tile' ? 'tile' : 'rail'}
				eager={size === 'hero'}
				className="absolute inset-0 size-full"
				fallbackLabel={book.title}
				fallbackBg={tone.bg}
				fallbackFg={tone.fg}
			/>
			<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/5" />
			{size !== 'thumb' && !plain ? (
				<div className="absolute inset-x-0 bottom-0 p-3 text-white">
					<p className={cn('leading-[1.15] font-extrabold', size === 'hero' ? 'text-2xl' : 'text-[0.95rem]')}>
						{book.title}
					</p>
					<p className="mt-1 text-[0.65rem] tracking-wide uppercase opacity-80">{author}</p>
				</div>
			) : null}
		</>
	);

	if (linked) {
		return (
			<a href={href} className={className} style={style} title={`${book.title} — ${authorLine(book.authors)}`}>
				{inner}
			</a>
		);
	}

	return (
		<div className={className} style={style} title={`${book.title} — ${authorLine(book.authors)}`}>
			{inner}
		</div>
	);
}
