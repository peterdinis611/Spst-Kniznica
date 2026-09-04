'use client';

import { FaultFolio } from '@/components/FaultFolio';

export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
	const jammed = !/404|NOT_FOUND/i.test(error.message);
	return <FaultFolio status={jammed ? 500 : 404} message={error.message} />;
}
