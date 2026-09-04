export function slovakAuthMessage(raw: string | undefined, fallback: string) {
	const text = (raw ?? '').toLowerCase();

	if (text.includes('invalid login credentials')) return 'Nesprávny e-mail alebo heslo.';
	if (text.includes('email not confirmed')) {
		return 'Potvrď účet v e-maile, ktorý sme poslali na tvoju adresu.';
	}
	if (text.includes('user already registered') || text.includes('already been registered')) {
		return 'Tento e-mail už má účet. Prihlás sa, alebo obnov heslo.';
	}
	if (
		text.includes('password should be at least') ||
		text.includes('password is known to be weak')
	) {
		return 'Heslo musí mať aspoň 8 znakov a nesmie byť triviálne.';
	}
	if (text.includes('unable to validate email') || text.includes('invalid email')) {
		return 'E-mail nevyzerá ako adresa. Skús to znova.';
	}
	if (text.includes('you can only request this after') || text.includes('for security purposes')) {
		return 'Počkaj chvíľu a skús to znova.';
	}
	if (text.includes('new password should be different')) {
		return 'Nové heslo musí byť iné ako doterajšie.';
	}
	if (text.includes('same password')) return 'Nové heslo musí byť iné ako doterajšie.';
	if (text.includes('session') && text.includes('missing')) {
		return 'Odkaz na obnovu hesla vypršal. Požiadaj o nový.';
	}

	return fallback;
}

export function safeAuthNext(next: string | null, fallback = '/loans') {
	if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
		return fallback;
	}

	return next;
}
