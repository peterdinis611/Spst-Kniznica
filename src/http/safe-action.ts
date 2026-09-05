import { createSafeActionClient, returnServerError } from 'next-safe-action';
import { redirect } from 'next/navigation';
import { isActionFailure } from '@/http/kit';
import { failIfRateLimited } from '@/server/rate-limit';
import { actionEvent, getSessionReader } from '@/server/session';

export const actionClient = createSafeActionClient({
	defaultValidationErrorsShape: 'flattened',
	handleServerError() {
		return 'Fond túto kartu teraz neotvorí.';
	}
});

export const authActionClient = actionClient.use(async ({ next }) => {
	const user = await getSessionReader();
	if (!user) redirect('/login');
	const blocked = await failIfRateLimited(await actionEvent(), 'action', {}, user.id);
	if (blocked && isActionFailure(blocked)) returnServerError(blocked.data.message);
	return next({ ctx: { user } });
});
