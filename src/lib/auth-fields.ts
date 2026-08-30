import { flattenFields } from '$lib/form-kit';
import * as v from 'valibot';

export type AuthFields = {
	name?: string;
	email?: string;
	password?: string;
	confirm?: string;
};

export type FieldErrors = {
	name?: string;
	email?: string;
	password?: string;
	confirm?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function hasFieldErrors(errors: FieldErrors) {
	return Boolean(errors.name || errors.email || errors.password || errors.confirm);
}

const nameSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(2, 'Meno na preukaze musí mať aspoň dve písmená.'),
	v.maxLength(80, 'Meno je príliš dlhé.'),
	v.regex(/\p{L}/u, 'Meno musí obsahovať písmeno.')
);

export const emailSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Zadaj e-mail.'),
	v.maxLength(254, 'E-mail je príliš dlhý.'),
	v.regex(EMAIL_RE, 'E-mail nevyzerá ako adresa.')
);

function passwordSchema(kind: 'login' | 'new') {
	const base = v.pipe(
		v.string(),
		v.minLength(1, 'Zadaj heslo.'),
		v.check((value) => !/\s/.test(value), 'Heslo nesmie obsahovať medzeru.'),
		v.minLength(8, 'Heslo musí mať aspoň 8 znakov.'),
		v.maxLength(72, 'Heslo môže mať najviac 72 znakov.')
	);
	if (kind === 'login') return base;
	return v.pipe(
		base,
		v.check(
			(value) => /\p{L}/u.test(value) && /\d/.test(value),
			'Pridaj aspoň jedno písmeno a jednu číslicu.'
		)
	);
}

export const signInSchema = v.object({
	email: emailSchema,
	password: passwordSchema('login')
});

export const signUpSchema = v.pipe(
	v.object({
		name: nameSchema,
		email: emailSchema,
		password: passwordSchema('new'),
		confirm: v.pipe(v.string(), v.minLength(1, 'Zopakuj heslo.'))
	}),
	v.forward(
		v.partialCheck(
			[['password'], ['confirm']],
			(input) => input.password === input.confirm,
			'Heslá sa nezhodujú.'
		),
		['confirm']
	)
);

export const resetEmailSchema = v.object({
	email: emailSchema
});

export const newPasswordSchema = v.pipe(
	v.object({
		password: passwordSchema('new'),
		confirm: v.pipe(v.string(), v.minLength(1, 'Zopakuj heslo.'))
	}),
	v.forward(
		v.partialCheck(
			[['password'], ['confirm']],
			(input) => input.password === input.confirm,
			'Heslá sa nezhodujú.'
		),
		['confirm']
	)
);

export function validateName(raw: string) {
	return flattenFields(v.object({ name: nameSchema }), { name: raw }).name;
}

export function validateEmail(raw: string) {
	return flattenFields(resetEmailSchema, { email: raw }).email;
}

export function validatePassword(raw: string, kind: 'login' | 'new' = 'new') {
	return flattenFields(v.object({ password: passwordSchema(kind) }), { password: raw }).password;
}

export function validateConfirm(password: string, confirm: string) {
	return flattenFields(newPasswordSchema, { password, confirm }).confirm;
}

export function validateSignIn(fields: Pick<AuthFields, 'email' | 'password'>): FieldErrors {
	const next = flattenFields(signInSchema, {
		email: fields.email ?? '',
		password: fields.password ?? ''
	});
	return { email: next.email, password: next.password };
}

export function validateSignUp(fields: AuthFields): FieldErrors {
	const next = flattenFields(signUpSchema, {
		name: fields.name ?? '',
		email: fields.email ?? '',
		password: fields.password ?? '',
		confirm: fields.confirm ?? ''
	});
	return { name: next.name, email: next.email, password: next.password, confirm: next.confirm };
}

export function validateResetEmail(fields: Pick<AuthFields, 'email'>): FieldErrors {
	return { email: flattenFields(resetEmailSchema, { email: fields.email ?? '' }).email };
}

export function validateNewPassword(fields: Pick<AuthFields, 'password' | 'confirm'>): FieldErrors {
	const next = flattenFields(newPasswordSchema, {
		password: fields.password ?? '',
		confirm: fields.confirm ?? ''
	});
	return { password: next.password, confirm: next.confirm };
}

export function passwordStrength(password: string) {
	if (!password) return 0;
	let score = 0;
	if (password.length >= 8) score += 1;
	if (/\p{L}/u.test(password) && /\d/.test(password)) score += 1;
	if (password.length >= 12 || /[^A-Za-z0-9]/.test(password)) score += 1;
	return Math.min(3, score);
}

export const strengthLabel = ['', 'slabé', 'ide to', 'pevné'] as const;
