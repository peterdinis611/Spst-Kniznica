'use client';

import { useStateAction } from 'next-safe-action/hooks';
import { AuthPass } from '@/components/AuthPass';
import { PassSecret } from '@/components/PassSecret';
import { formToasts } from '@/notify/toast';
import { bindFormAction } from '@/utils/form-kit';
import { setPasswordAction } from './actions';

export function PasswordForm({ configured, name }: { configured: boolean; name: string }) {
	const action = useStateAction(setPasswordAction, { throwOnNavigation: true, ...formToasts });
	const note = action.result.data?.message ?? action.result.serverError;
	const passwordError = action.result.validationErrors?.fieldErrors?.password?.[0];
	const confirmError = action.result.validationErrors?.fieldErrors?.confirm?.[0];

	return (
		<AuthPass
			kicker="Nové heslo"
			title="Zmeň pečiatku."
			lede={`${name} — heslo 8+, písmeno a číslica. Po uložení ideš na Moje knihy.`}
		>
			<form action={bindFormAction(action.execute)} className="pass-form">
				<PassSecret
					id="password"
					name="password"
					label="Nové heslo"
					autoComplete="new-password"
					error={passwordError}
					meter
				/>
				<PassSecret
					id="confirm"
					name="confirm"
					label="Zopakuj heslo"
					autoComplete="new-password"
					error={confirmError}
				/>
				{configured ? null : <p className="pass-note">Supabase v .env ešte nie je.</p>}
				{note ? <p className="pass-note">{note}</p> : null}
				<button className="pass-go" type="submit" disabled={!configured || action.isExecuting}>
					Uložiť heslo
				</button>
			</form>
		</AuthPass>
	);
}
