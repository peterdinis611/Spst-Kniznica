import { sleep } from 'k6';
import { browseOnce, get, pageOk, probeFond, TESTID } from './lib.js';

export const options = {
	tags: { testid: TESTID, suite: 'stress' },
	scenarios: {
		pult: {
			executor: 'ramping-vus',
			startVUs: 0,
			stages: [
				{ duration: '20s', target: 10 },
				{ duration: '40s', target: 25 },
				{ duration: '40s', target: 50 },
				{ duration: '30s', target: 80 },
				{ duration: '20s', target: 0 }
			],
			gracefulRampDown: '15s'
		}
	},
	thresholds: {
		http_req_failed: [{ threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '25s' }],
		http_req_duration: ['p(95)<3000'],
		'http_req_duration{name:Register}': ['p(95)<5000'],
		checks: ['rate>0.9']
	}
};

export function setup() {
	probeFond();
}

export default function () {
	if (Math.random() < 0.35) {
		pageOk(get('/holdings', 'Register'), 'Register');
	} else {
		browseOnce();
	}
	sleep(Math.random() * 0.4 + 0.15);
}
