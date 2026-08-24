import { sleep } from 'k6';
import { browseOnce, DESK, get, jsonOk, pageOk, probeFond, TESTID } from './lib.js';

export const options = {
	tags: { testid: TESTID, suite: 'smoke' },
	vus: 1,
	iterations: 8,
	thresholds: {
		http_req_failed: ['rate<0.01'],
		http_req_duration: ['p(95)<1200'],
		checks: ['rate>0.99']
	}
};

export function setup() {
	probeFond();
}

export const options = {
	tags: { testid: TESTID, suite: 'smoke' },
	vus: 1,
	iterations: 8,
	thresholds: {
		http_req_failed: ['rate<0.01'],
		http_req_duration: ['p(95)<1200'],
		checks: ['rate>0.99']
	}
};

export default function () {
	for (const desk of DESK) {
		pageOk(get(desk.path, desk.name), desk.name);
	}
	jsonOk(get('/api/search?q=algoritm', 'Hľadanie'), 'Hľadanie');
	pageOk(get('/books/book-algoritmy', 'Karta'), 'Karta');
	browseOnce();
	sleep(0.3);
}
