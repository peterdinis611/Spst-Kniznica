import { sleep } from 'k6';
import { browseOnce, probeFond, TESTID } from './lib.js';

export const options = {
	tags: { testid: TESTID, suite: 'load' },
	scenarios: {
		citania: {
			executor: 'ramping-vus',
			startVUs: 0,
			stages: [
				{ duration: '20s', target: 8 },
				{ duration: '1m', target: 16 },
				{ duration: '20s', target: 0 }
			],
			gracefulRampDown: '10s'
		}
	},
	thresholds: {
		http_req_failed: ['rate<0.02'],
		http_req_duration: ['p(95)<1500'],
		'http_req_duration{name:Register}': ['p(95)<2500'],
		checks: ['rate>0.95']
	}
};

export function setup() {
	probeFond();
}

export default function () {
	browseOnce();
	sleep(Math.random() * 0.8 + 0.4);
}
