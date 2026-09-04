import http from 'k6/http';
import { check } from 'k6';

const BASE = (__ENV.BASE_URL || 'http://host.docker.internal:3000').replace(/\/$/, '');

export const BASE_URL = BASE;

export const TESTID = __ENV.TESTID || `fond-${Date.now()}`;

export const SEARCHES = [
	'algoritm',
	'sql',
	'siet',
	'pascal',
	'INF',
	'stroj',
	'sloh',
	'belko',
	'rezerv'
];

export const BOOKS = [
	'book-algoritmy',
	'book-databazy',
	'book-siete',
	'book-cpp',
	'book-kreslenie',
	'book-casti',
	'book-elektro',
	'book-sloh',
	'book-english',
	'book-materialy'
];

export const AUTHORS = [
	'jan-belko',
	'maria-kovacova',
	'ludovit-stur',
	'eva-tothova',
	'milan-rufus'
];

export const DEPARTMENTS = [
	'informatika',
	'strojarstvo',
	'elektrotechnika',
	'literatura',
	'matematika',
	'fyzika'
];

export const DOCS = [
	'/docs',
	'/docs/pult',
	'/docs/katalog',
	'/docs/vypozicky',
	'/docs/email',
	'/docs/zataz'
];

export const DESK = [
	{ name: 'Sieň', path: '/' },
	{ name: 'Objavovať', path: '/discover' },
	{ name: 'Katalóg', path: '/books' },
	{ name: 'Register', path: '/holdings' },
	{ name: 'Odbory', path: '/departments' },
	{ name: 'Autori', path: '/authors' },
	{ name: 'Účet', path: '/login' },
	{ name: 'Príručka', path: '/docs' }
];

export const ALIASES = [
	{ from: '/vsetky-knihy', to: '/holdings' },
	{ from: '/knihy', to: '/books' },
	{ from: '/odbory', to: '/departments' },
	{ from: '/autori', to: '/authors' },
	{ from: '/vypozicky', to: '/loans' },
	{ from: '/preukaz', to: '/profile' },
	{ from: '/profil', to: '/profile' },
	{ from: '/prihlasenie', to: '/login' },
	{ from: '/registracia', to: '/login?mod=novy' },
	{ from: '/zabudnute-heslo', to: '/login/recovery' },
	{ from: '/nove-heslo', to: '/login/password' },
	{ from: '/login/obnova', to: '/login/recovery' },
	{ from: '/login/heslo', to: '/login/password' },
	{ from: '/odhlasenie', to: '/logout' },
	{ from: '/pult', to: '/admin' },
	{ from: '/admin/odbory', to: '/admin/departments' },
	{ from: '/admin/autori', to: '/admin/authors' },
	{ from: '/admin/knihy', to: '/admin/books' },
	{ from: '/admin/vazby', to: '/admin/book-authors' },
	{ from: '/admin/vytlacky', to: '/admin/holdings' },
	{ from: '/admin/vypozicky', to: '/admin/loans' },
	{ from: '/admin/rezervacie', to: '/admin/reservations' },
	{ from: '/admin/citately', to: '/admin/readers' },
	{ from: '/admin/vykazy', to: '/admin/reports' }
];

export const GATES = [
	{ name: 'Pult', path: '/admin', to: '/login' },
	{ name: 'Čítačka', path: '/admin/scan', to: '/login' },
	{ name: 'Výkazy', path: '/admin/reports', to: '/login' },
	{ name: 'Profil', path: '/profile', to: '/login' },
	{ name: 'Moje knihy', path: '/loans', to: '/login' },
	{ name: 'Nové heslo', path: '/login/password', to: '/login/recovery' },
	{ name: 'Odhlásenie', path: '/logout', to: '/' }
];

export function headers() {
	return {
		Accept: 'text/html,application/json',
		'Accept-Language': 'sk-SK,sk;q=0.9'
	};
}

export function get(path, name, extra = {}) {
	return http.get(`${BASE}${path}`, {
		headers: headers(),
		tags: { name, testid: TESTID },
		timeout: '60s',
		...extra
	});
}

export function getStay(path, name, extra = {}) {
	return get(path, name, { redirects: 0, ...extra });
}

export function probeFond() {
	const res = http.get(`${BASE}/`, {
		headers: headers(),
		timeout: '8s',
		tags: { name: 'Probe', testid: TESTID }
	});
	if (res.status === 200 && res.body && res.body.length > 200) return;

	const why = res.error
		? res.error
		: `HTTP ${res.status}${res.body ? `, ${String(res.body).slice(0, 160)}` : ''}`;
	throw new Error(
		`k6 sa nespája s fondom na ${BASE} (${why}). ` +
			`Na Macu musí bežať bun run dev (3000) alebo bun run start (3000) a počúvať na 0.0.0.0. ` +
			`Produkčný start: BASE_URL=http://host.docker.internal:3000 bun run k6:smoke`
	);
}

export function pageOk(res, name) {
	return check(res, {
		[`${name} · 200`]: (r) => r.status === 200,
		[`${name} · telo`]: (r) => r.body && r.body.length > 200
	});
}

export function jsonOk(res, name) {
	return check(res, {
		[`${name} · 200`]: (r) => r.status === 200,
		[`${name} · json`]: (r) => {
			try {
				const body = r.json();
				return Array.isArray(body.items);
			} catch {
				return false;
			}
		}
	});
}

export function textOk(res, name, needle) {
	return check(res, {
		[`${name} · 200`]: (r) => r.status === 200,
		[`${name} · telo`]: (r) => Boolean(r.body && String(r.body).includes(needle))
	});
}

export function statusOk(res, name, status) {
	return check(res, {
		[`${name} · ${status}`]: (r) => r.status === status
	});
}

function header(res, key) {
	const headers = res.headers || {};
	return headers[key] || headers[key.toLowerCase()] || headers[key.toUpperCase()] || '';
}

export function redirectOk(res, name, status, location) {
	return check(res, {
		[`${name} · ${status}`]: (r) => r.status === status,
		[`${name} · kam`]: (r) => {
			const loc = String(header(r, 'Location'));
			if (location === '/') {
				const path = loc.replace(/^https?:\/\/[^/]+/, '') || '/';
				return path === '/' || path === '';
			}
			return loc.includes(location);
		}
	});
}

export function pick(list) {
	return list[Math.floor(Math.random() * list.length)];
}

export function checkPublicMap() {
	for (const alias of ALIASES) {
		redirectOk(getStay(alias.from, `Alias ${alias.from}`), `Alias ${alias.from}`, 308, alias.to);
	}

	for (const gate of GATES) {
		redirectOk(getStay(gate.path, gate.name), gate.name, 302, gate.to);
	}

	pageOk(get('/login', 'Účet'), 'Účet');
	pageOk(get('/login/recovery', 'Obnova'), 'Obnova');
	pageOk(get('/login?mod=novy', 'Registrácia'), 'Registrácia');
	pageOk(get(`/authors/${pick(AUTHORS)}`, 'Autor'), 'Autor');
	pageOk(get(`/departments/${pick(DEPARTMENTS)}`, 'Odbor'), 'Odbor');
	pageOk(get('/docs/pult', 'Kapitola'), 'Kapitola');
	pageOk(get('/docs/email', 'Listy'), 'Listy');
	pageOk(get('/docs/vypozicky', 'Výpožičky'), 'Výpožičky');
	pageOk(get('/auth/error', 'Chyba účtu'), 'Chyba účtu');
	textOk(get('/robots.txt', 'Robots'), 'Robots', 'Disallow: /admin');
	textOk(get('/sitemap.xml', 'Sitemap'), 'Sitemap', '/docs/email');
	statusOk(
		getStay('/api/desk/tick', 'Tik', {
			responseCallback: http.expectedStatuses(403)
		}),
		'Tik',
		403
	);
}

export function browseOnce() {
	const desk = pick(DESK);
	pageOk(get(desk.path, desk.name), desk.name);

	const query = pick(SEARCHES);
	jsonOk(get(`/api/search?q=${encodeURIComponent(query)}`, 'Hľadanie'), 'Hľadanie');

	if (Math.random() < 0.45) {
		pageOk(get(`/books/${pick(BOOKS)}`, 'Karta'), 'Karta');
	}

	if (Math.random() < 0.25) {
		pageOk(get(`/departments/${pick(DEPARTMENTS)}`, 'Odbor'), 'Odbor');
	}

	if (Math.random() < 0.2) {
		pageOk(get(`/authors/${pick(AUTHORS)}`, 'Autor'), 'Autor');
	}

	if (Math.random() < 0.15) {
		pageOk(get(pick(DOCS), 'Kapitola'), 'Kapitola');
	}

	if (Math.random() < 0.15) {
		const alias = pick(ALIASES);
		pageOk(get(alias.from, `Alias ${alias.from}`), `Alias ${alias.from}`);
	}
}
