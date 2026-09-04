export function SchoolMark({ className = '' }: { className?: string }) {
	return (
		<img
			src="/brand/spsbj-mark.png"
			alt=""
			width={188}
			height={264}
			decoding="async"
			fetchPriority="high"
			className={className}
		/>
	);
}
