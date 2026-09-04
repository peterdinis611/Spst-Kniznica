'use client';

import { useStateAction } from 'next-safe-action/hooks';
import { AuthPass } from '@/components/AuthPass';
import { formToasts } from '@/notify/toast';
import { bindFormAction } from '@/utils/form-kit';
import { recoverAction } from '../actions';

export function RecoveryForm({ configured }: { configured: boolean }) {
	const action = useStateAction(recoverAction, formToasts);
	const note = action.result.data?.message ?? action.result.serverError;
	const emailError = action.result.validationErrors?.fieldErrors?.email?.[0];
	const emailValue = action.result.data?.values?.email ?? action.input?.email ?? '';

	return (
		<AuthPass
			kicker="Obnova"
			title="Zabudnuté heslo."
			lede="Zadaj e-mail. Ak máš účet, príde odkaz na nové heslo."
		>
			<form action={bindFormAction(action.execute)} className="pass-form">
				<div className={`pass-field${emailError ? 'is-bad' : ''}`}>
					<label htmlFor="email">E-mail</label>
					<input
						id="email"
						name="email"
						type="email"
						required
						autoComplete="email"
						defaultValue={emailValue}
					/>
					{emailError ? <p className="pass-error">{emailError}</p> : null}
				</div>
				{configured ? null : <p className="pass-note">Supabase v .env ešte nie je.</p>}
				{note ? (
					<p className={`pass-note${action.result.data?.ok ? 'is-ok' : ''}`}>{note}</p>
				) : null}
				<button className="pass-go" type="submit" disabled={!configured || action.isExecuting}>
					Poslať odkaz
				</button>
			</form>
		</AuthPass>
	);
}
