'use server';

import { returnServerError } from 'next-safe-action';
import { redirect } from 'next/navigation';
import { newPasswordSchema } from '@/auth/auth-fields';
import { actionClient } from '@/http/safe-action';
import { noticeHref } from '@/notify/notices';
import { sendPasswordChangedLetter } from '@/server/auth-mail';
import { slovakAuthMessage } from '@/server/auth-message';
import { failIfRateLimited } from '@/server/rate-limit';
import { actionEvent, createSupabaseServer, getSessionReader } from '@/server/session';
import { isActionFailure } from '@/http/kit';
import { mailOrigin } from '@/server/mail-slip';

export type PasswordData = {
	message?: string;
};

export const setPasswordAction = actionClient
	.inputSchema(newPasswordSchema)
	.stateAction(async ({ parsedInput }): Promise<PasswordData> => {
		const user = await getSessionReader();
		if (!user) redirect('/login/recovery');

		const blocked = await failIfRateLimited(await actionEvent(), 'auth');
		if (blocked && isActionFailure(blocked)) {
			returnServerError(blocked.data.message);
		}

		const supabase = await createSupabaseServer();
		if (!supabase) {
			returnServerError('Zmena hesla nie je nastavená. Chýba Supabase v .env.');
		}

		const { error } = await supabase.auth.updateUser({ password: parsedInput.password });
		if (error) {
			return {
				message: slovakAuthMessage(error.message, 'Nové heslo sa nepodarilo uložiť.')
			};
		}

		await sendPasswordChangedLetter({
			to: user.email,
			name: user.name,
			profileHref: `${mailOrigin()}/profile`
		});

		redirect(noticeHref('/loans', 'login'));
	});
