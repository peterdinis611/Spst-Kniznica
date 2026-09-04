import { createSafeActionClient } from 'next-safe-action';
import { redirect } from 'next/navigation';
import { getSessionReader } from '@/server/session';

export const actionClient = createSafeActionClient({
	defaultValidationErrorsShape: 'flattened',
	handleServerError() {
		return 'Fond túto kartu teraz neotvorí.';
	}
});

export const authActionClient = actionClient.use(async ({ next }) => {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	return next({ ctx: { user } });
});
