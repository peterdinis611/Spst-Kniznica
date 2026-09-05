export type NoticeKind = 'success' | 'error' | 'info';

export type Notice = {
	kind: NoticeKind;
	text: string;
	sub?: string;
};

export const notices = {
	logout: {
		kind: 'success',
		text: 'Si odhlásený.',
		sub: 'Preukaz je von zo skrine.'
	},
	login: {
		kind: 'success',
		text: 'Preukaz je v poriadku.',
		sub: 'Môžeš brať knihy.'
	},
	signup: {
		kind: 'success',
		text: 'Preukaz je vystavený.',
		sub: 'Vitaj vo fonde.'
	},
	confirmed: {
		kind: 'success',
		text: 'Účet je potvrdený.',
		sub: 'Preukaz je v skrini.'
	},
	recover: {
		kind: 'success',
		text: 'Ak máš účet, príde odkaz na nové heslo.'
	},
	'auth-fail': {
		kind: 'error',
		text: 'Odkaz už neplatí.',
		sub: 'Skús sa prihlásiť, alebo požiadaj o nový.'
	},
	borrow: {
		kind: 'success',
		text: 'Zväzok je tvoj.',
		sub: 'Lehota je na lístku.'
	},
	'borrow-fail': {
		kind: 'error',
		text: 'Lístok neprešiel.',
		sub: 'Skontroluj meno, triedu a dobu.'
	},
	order: {
		kind: 'info',
		text: 'Objednávka je v zásobníku.',
		sub: 'Pečiatka padne o chvíľu. Jeden výtlačok ide len jednému.'
	},
	'order-fail': {
		kind: 'error',
		text: 'Zväzok už nie je voľný.',
		sub: 'Zaradíme ťa do radu, alebo skús iný kus.'
	},
	'order-busy': {
		kind: 'info',
		text: 'Túto objednávku už máš v zásobníku.'
	},
	'order-limit': {
		kind: 'error',
		text: 'Príliš veľa objednávok.',
		sub: 'Počkaj chvíľu a skús to znova.'
	},
	hold: {
		kind: 'success',
		text: 'Si v rade.',
		sub: 'Dáme vedieť, keď sa uvoľní.'
	},
	'hold-fail': {
		kind: 'error',
		text: 'Do radu sa to teraz nedalo.'
	},
	return: {
		kind: 'success',
		text: 'Vrátenie je nahlásené.',
		sub: 'Dones zväzok na pult.'
	},
	'return-fail': {
		kind: 'error',
		text: 'Vrátenie sa nepodarilo.'
	},
	renew: {
		kind: 'success',
		text: 'Lehota je predĺžená.'
	},
	'renew-fail': {
		kind: 'error',
		text: 'Predĺženie sa nepodarilo.'
	},
	'wait-cancel': {
		kind: 'success',
		text: 'Rezervácia je stiahnutá.'
	},
	'history-clear': {
		kind: 'success',
		text: 'História lístkov je prázdna.'
	},
	pace: {
		kind: 'error',
		text: 'Príliš veľa pokusov.',
		sub: 'Počkaj chvíľu a skús to znova.'
	}

export type NoticeKey = keyof typeof notices;

export function isNoticeKey(value: string | null | undefined): value is NoticeKey {
	return Boolean(value && value in notices);
}

export function noticeFromSearch(notice: string | null, ok?: string | null): NoticeKey | null {
	if (isNoticeKey(notice)) return notice;
	if (ok === 'borrow' || ok === 'hold') return ok;
	return null;
}

export function noticeHref(path: string, key: NoticeKey): string {
	const hashIndex = path.indexOf('#');
	const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
	const withoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
	const qIndex = withoutHash.indexOf('?');
	const pathname = qIndex >= 0 ? withoutHash.slice(0, qIndex) : withoutHash;
	const search = qIndex >= 0 ? withoutHash.slice(qIndex + 1) : '';
	const params = new URLSearchParams(search);
	params.set('notice', key);
	return `${pathname}?${params.toString()}${hash}`;
}
