'use client';

import { useActionState } from 'react';
import { AuthPass } from '@/components/AuthPass';
import { PassSecret } from '@/components/PassSecret';
import { signInAction, signUpAction, type LoginState } from './actions';

export function LoginForm({ register, configured }: { register: boolean; configured: boolean }) {
	const [state, action] = useActionState(register ? signUpAction : signInAction, {
		mode: register ? 'novy' : 'vstup'
	} satisfies LoginState);
	const noteOk = Boolean(state.ok);

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
					<a href="/login" className={!register ? 'is-on' : undefined}>
						Mám účet
					</a>
					<a href="/login?mod=novy" className={register ? 'is-on' : undefined}>
						Som nový
					</a>
				</>
			}
		>
			<form action={action} className="pass-form" noValidate>
				{register ? (
					<div className={`pass-field${state.errors?.name ? ' is-bad' : ''}`}>
						<label htmlFor="name">Meno</label>
						<input
							id="name"
							name="name"
							autoComplete="name"
							defaultValue={state.values?.name ?? ''}
							maxLength={80}
							aria-invalid={state.errors?.name ? true : undefined}
						/>
						{state.errors?.name ? <p className="pass-error">{state.errors.name}</p> : null}
					</div>
				) : null}
				<div className={`pass-field${state.errors?.email ? ' is-bad' : ''}`}>
					<label htmlFor="email">E-mail</label>
					<input
						id="email"
						type="email"
						name="email"
						autoComplete="email"
						defaultValue={state.values?.email ?? ''}
						maxLength={254}
					/>
					{state.errors?.email ? <p className="pass-error">{state.errors.email}</p> : null}
				</div>
				{noteOk ? null : (
					<>
						<PassSecret
							id="password"
							label="Heslo"
							autoComplete={register ? 'new-password' : 'current-password'}
							error={state.errors?.password}
							meter={register}
						/>
						{register ? (
							<PassSecret
								id="confirm"
								name="confirm"
								label="Heslo znova"
								autoComplete="new-password"
								error={state.errors?.confirm}
							/>
						) : null}
					</>
				)}
				{register ? null : (
					<p className="pass-help">
						<a href="/login/recovery">Zabudnuté heslo?</a>
					</p>
				)}
				{!configured ? (
					<p className="pass-note">
						Pult ešte nemá kľúč od skrine. Doplň <code>PUBLIC_SUPABASE_URL</code> a kľúč do <code>.env</code>.
					</p>
				) : state.message ? (
					<p className={`pass-note${noteOk ? ' is-ok' : ''}`}>{state.message}</p>
				) : null}
				{noteOk ? (
					<a className="pass-back" href="/login">
						Späť na prihlásenie
					</a>
				) : (
					<button className="pass-go" type="submit" disabled={!configured}>
						{register ? 'Vytvoriť preukaz' : 'Prihlásiť sa'}
					</button>
				)}
			</form>
		</AuthPass>
	);
}
