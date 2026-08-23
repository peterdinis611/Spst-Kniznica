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

export function validateName(raw: string) {
	const name = raw.trim();
	if (name.length < 2) return 'Meno na preukaze musí mať aspoň dve písmená.';
	if (name.length > 80) return 'Meno je príliš dlhé.';
	if (!/\p{L}/u.test(name)) return 'Meno musí obsahovať písmeno.';
	return undefined;
}

export function validateEmail(raw: string) {
	const email = raw.trim();
	if (!email) return 'Zadaj e-mail.';
	if (email.length > 254) return 'E-mail je príliš dlhý.';
	if (!EMAIL_RE.test(email)) return 'E-mail nevyzerá ako adresa.';
	return undefined;
}

export function validatePassword(raw: string, kind: 'login' | 'new' = 'new') {
	if (!raw) return 'Zadaj heslo.';
	if (/\s/.test(raw)) return 'Heslo nesmie obsahovať medzeru.';
	if (raw.length < 8) return 'Heslo musí mať aspoň 8 znakov.';
	if (raw.length > 72) return 'Heslo môže mať najviac 72 znakov.';
	if (kind === 'new' && (!/\p{L}/u.test(raw) || !/\d/.test(raw))) {
		return 'Pridaj aspoň jedno písmeno a jednu číslicu.';
	}
	return undefined;
}

export function validateConfirm(password: string, confirm: string) {
	if (!confirm) return 'Zopakuj heslo.';
	if (confirm !== password) return 'Heslá sa nezhodujú.';
	return undefined;
}

export function validateSignIn(fields: Pick<AuthFields, 'email' | 'password'>): FieldErrors {
	return {
		email: validateEmail(fields.email ?? ''),
		password: validatePassword(fields.password ?? '', 'login')
	};
}

export function validateSignUp(fields: AuthFields): FieldErrors {
	return {
		name: validateName(fields.name ?? ''),
		email: validateEmail(fields.email ?? ''),
		password: validatePassword(fields.password ?? '', 'new'),
		confirm: validateConfirm(fields.password ?? '', fields.confirm ?? '')
	};
}

export function validateResetEmail(fields: Pick<AuthFields, 'email'>): FieldErrors {
	return { email: validateEmail(fields.email ?? '') };
}

export function validateNewPassword(fields: Pick<AuthFields, 'password' | 'confirm'>): FieldErrors {
	return {
		password: validatePassword(fields.password ?? '', 'new'),
		confirm: validateConfirm(fields.password ?? '', fields.confirm ?? '')
	};
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
