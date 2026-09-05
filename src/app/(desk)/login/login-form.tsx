'use client';

import Link from 'next/link';
import { useStateAction } from 'next-safe-action/hooks';
import { AuthPass } from '@/components/AuthPass';
import { PassSecret } from '@/components/PassSecret';
import { formToasts } from '@/notify/toast';
import { bindFormAction } from '@/utils/form-kit';
import { signInAction, signUpAction } from './actions';

function fieldError(
	errors: { fieldErrors?: Record<string, string[] | undefined> } | undefined,
	field: string
) {
	return errors?.fieldErrors?.[field]?.[0];
}

export function LoginForm({ register, configured }: { register: boolean; configured: boolean }) {
	const signIn = useStateAction(signInAction, { throwOnNavigation: true, ...formToasts });
	const signUp = useStateAction(signUpAction, { throwOnNavigation: true, ...formToasts });
	const current = register ? signUp : signIn;
	const data = current.result.data;
	const errors = current.result.validationErrors;
	const note = data?.message ?? current.result.serverError;
	const noteOk = Boolean(data?.ok);
	const nameError = fieldError(errors, 'name');
	const emailError = fieldError(errors, 'email');
	const passwordError = fieldError(errors, 'password');
	const confirmError = fieldError(errors, 'confirm');
	const emailValue = data?.values?.email ?? current.input?.email ?? '';
	const nameValue = register ? (signUp.result.data?.values?.name ?? signUp.input?.name ?? '') : '';

	return (
		<AuthPass
			kicker="Čitateľský účet"
			title={register ? 'Nový preukaz.' : 'Polož preukaz.'}
			lede={
				register
					? 'Meno, e-mail, heslo (8+, písmeno a číslica). Ak fond potvrdzuje e-mail, najprv otvor odkaz v správe.'
					: 'E-mail a heslo. Potom môžeš brať knihy — 7, 14 alebo 21 dní, koľko treba.'
			}
			serial={register ? 'NOVÝ · PREUKAZ · SPŠT' : 'PREUKAZ · PAV. B · 7–21 D'}
			tabs={
				<>
					<Link href="/login" className={!register ? 'is-on' : undefined}>
						Mám účet
					</Link>
					<Link href="/login?mod=novy" className={register ? 'is-on' : undefined}>
						Som nový
					</Link>
				</>
			}
		>
			<form
				action={register ? bindFormAction(signUp.execute) : bindFormAction(signIn.execute)}
				className="pass-form"
				noValidate
			>
				{register ? (
					<div className={`pass-field${nameError ? 'is-bad' : ''}`}>
						<label htmlFor="name">Meno</label>
						<input
							id="name"
							name="name"
							autoComplete="name"
							defaultValue={nameValue}
							maxLength={80}
							aria-invalid={nameError ? true : undefined}
						/>
						{nameError ? <p className="pass-error">{nameError}</p> : null}
					</div>
				) : null}
				<div className={`pass-field${emailError ? 'is-bad' : ''}`}>
					<label htmlFor="email">E-mail</label>
					<input
						id="email"
						type="email"
						name="email"
						autoComplete="email"
						defaultValue={emailValue}
						maxLength={254}
					/>
					{emailError ? <p className="pass-error">{emailError}</p> : null}
				</div>
				{noteOk ? null : (
					<>
						<PassSecret
							id="password"
							label="Heslo"
							autoComplete={register ? 'new-password' : 'current-password'}
							error={passwordError}
							meter={register}
						/>
						{register ? (
							<PassSecret
								id="confirm"
								name="confirm"
								label="Heslo znova"
								autoComplete="new-password"
								error={confirmError}
							/>
						) : null}
					</>
				)}
				{register ? null : (
					<p className="pass-help">
						<Link href="/login/recovery">Zabudnuté heslo?</Link>
					</p>
				)}
				{!configured ? (
					<p className="pass-note">
						Pult ešte nemá kľúč od skrine. Doplň <code>PUBLIC_SUPABASE_URL</code> a kľúč do{' '}
						<code>.env</code>.
					</p>
				) : note ? (
					<p className={`pass-note${noteOk ? 'is-ok' : ''}`}>{note}</p>
				) : null}
				{noteOk ? (
					<Link className="pass-back" href="/login">
						Späť na prihlásenie
					</Link>
				) : (
					<button className="pass-go" type="submit" disabled={!configured || current.isExecuting}>
						{register ? 'Vytvoriť preukaz' : 'Prihlásiť sa'}
					</button>
				)}
			</form>
		</AuthPass>
	);
}
