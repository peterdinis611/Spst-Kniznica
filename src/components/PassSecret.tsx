'use client';

import { useState } from 'react';
import { passwordStrength, strengthLabel } from '@/auth/auth-fields';

export function PassSecret({
	id,
	name = 'password',
	label,
	autoComplete,
	defaultValue = '',
	error = '',
	meter = false
}: {
	id: string;
	name?: string;
	label: string;
	autoComplete: string;
	defaultValue?: string;
	error?: string;
	meter?: boolean;
}) {
	const [shown, setShown] = useState(false);
	const [value, setValue] = useState(defaultValue);
	const strength = passwordStrength(value);
	const errorId = `${id}-chyba`;
	const meterId = `${id}-sila`;

	return (
		<div className={`pass-field${error ? ' is-bad' : ''}`}>
			<label htmlFor={id}>{label}</label>
			<div className="pass-secret">
				<input
					id={id}
					name={name}
					className="pass-secret-input"
					type={shown ? 'text' : 'password'}
					autoComplete={autoComplete}
					value={value}
					onChange={(event) => setValue(event.currentTarget.value)}
					required
					minLength={8}
					maxLength={72}
					spellCheck={false}
					aria-invalid={error ? true : undefined}
					aria-describedby={
						[error ? errorId : '', meter ? meterId : ''].filter(Boolean).join(' ') || undefined
					}
				/>
				<button
					className="pass-peek"
					type="button"
					aria-pressed={shown}
					aria-label={shown ? 'Skryť heslo' : 'Ukázať heslo'}
					onClick={() => setShown((open) => !open)}
				>
					{shown ? 'skry' : 'ukáž'}
				</button>
			</div>
			{error ? (
				<p className="pass-error" id={errorId}>
					{error}
				</p>
			) : null}
			{meter && value ? (
				<p className="pass-meter" id={meterId} data-sila={strength} aria-live="polite">
					<span className="pass-meter-bars" aria-hidden="true">
						<i />
						<i />
						<i />
					</span>
					{strengthLabel[strength]}
				</p>
			) : null}
		</div>
	);
}
