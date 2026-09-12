import Link from 'next/link';
import type { ComponentProps } from 'react';

export type FolioLinkProps = ComponentProps<typeof Link>;

export function FolioLink({ prefetch = false, ...props }: FolioLinkProps) {
	return <Link prefetch={prefetch} {...props} />;
}
