import http from 'k6/http';
import { check } from 'k6';

const BASE = (__ENV.BASE_URL || 'http://host.docker.internal:5173').replace(/\/$/, '');

export const BASE_URL = BASE;

export const TESTID = __ENV.TESTID || `fond-${Date.now()}`;

export const SEARCHES = ['algoritm', 'sql', 'siet', 'pascal', 'INF', 'stroj'];

export const BOOKS = ['book-algoritmy', 'book-databazy', 'book-siete', 'book-cpp', 'book-kreslenie'];

export const DESK = [
	{ name: 'Sieň', path: '/' },
	{ name: 'Objavovať', path: '/discover' },
	{ name: 'Katalóg', path: '/books' },
	{ name: 'Register', path: '/holdings' },
	{ name: 'Odbory', path: '/departments' },
	{ name: 'Autori', path: '/authors' },
	{ name: 'Príručka', path: '/docs' }
];

export function headers() {
	return {
		Accept: 'text/html,application/json',
		'Accept-Language': 'sk-SK,sk;q=0.9'
	};
}

export function get(path, name) {
	return http.get(`${BASE}${path}`, {
		headers: headers(),
		tags: { name, testid: TESTID },
		timeout: '60s'
	});
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
			`Na Macu musí bežať npm run dev (5173) alebo npm run preview (4173) a počúvať na 0.0.0.0. ` +
			`Preview: BASE_URL=http://host.docker.internal:4173 npm run k6:smoke`
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

export function pick(list) {
	return list[Math.floor(Math.random() * list.length)];
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
		pageOk(get('/departments/informatika', 'Odbor'), 'Odbor');
	}
}
