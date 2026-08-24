import { sleep } from 'k6';
import { browseOnce, probeFond, TESTID } from './lib.js';

export const options = {
	tags: { testid: TESTID, suite: 'spike' },
	scenarios: {
		naraz: {
			executor: 'ramping-vus',
			startVUs: 2,
			stages: [
				{ duration: '15s', target: 4 },
				{ duration: '10s', target: 60 },
				{ duration: '30s', target: 60 },
				{ duration: '10s', target: 4 },
				{ duration: '15s', target: 0 }
			],
			gracefulRampDown: '10s'
		}
	},
	thresholds: {
		http_req_failed: ['rate<0.08'],
		http_req_duration: ['p(95)<4000']
	}
};

export function setup() {
	probeFond();
}

export default function () {
	browseOnce();
	sleep(0.2);
}
