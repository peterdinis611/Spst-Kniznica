import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const waitMs = 120_000;

function run(cmd: string, args: string[], opts: { inherit?: boolean } = {}) {
	return spawnSync(cmd, args, {
		cwd: root,
		stdio: opts.inherit ? 'inherit' : 'ignore',
		env: process.env
	});
}

function dockerReady() {
	return run('docker', ['info']).status === 0;
}

function launchEngine() {
	if (process.platform === 'darwin' && existsSync('/Applications/Docker.app')) {
		console.log('Zapínam Docker Desktop…');
		run('open', ['-a', '/Applications/Docker.app']);
		return;
	}
	if (run('which', ['colima']).status === 0) {
		console.log('Zapínam Colimu…');
		const started = run('colima', ['start'], { inherit: true });
		if (started.status !== 0) throw new Error('Colima sa nespustila.');
		return;
	}
	throw new Error('Docker nie je zapnutý. Otvor Docker Desktop a skús znova.');
}

async function waitForDocker() {
	const start = Date.now();
	while (Date.now() - start < waitMs) {
		if (dockerReady()) return;
		await new Promise((done) => setTimeout(done, 2000));
	}
	throw new Error('Docker sa nestihol zapnúť. Otvor Docker Desktop a skús znova.');
}

function composeUp() {
	const waited = run('docker', ['compose', 'up', '-d', '--wait', 'postgres'], { inherit: true });
	if (waited.status === 0) return;
	const plain = run('docker', ['compose', 'up', '-d', 'postgres'], { inherit: true });
	if (plain.status !== 0) throw new Error('Postgres kontajner sa nespustil.');
}

if (!dockerReady()) {
	launchEngine();
	await waitForDocker();
}

composeUp();
console.log('Postgres je pripravený.');
