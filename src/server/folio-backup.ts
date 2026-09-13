import { closeSync, openSync, statSync, unlinkSync } from 'node:fs';
import { mkdir, readdir, stat, unlink } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import { env } from '@/config/env';

export const FOLIO_BACKUP_NAME = /^fond-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.sql$/;

export type FolioBackupSlip = {
	name: string;
	bytes: number;
	at: Date;
};

export type FolioBackupReport = {
	ok: true;
	file: string;
	bytes: number;
	kept: number;
	via: 'pg_dump' | 'docker';
};

export function folioBackupDir(raw = env.BACKUP_DIR) {
	const custom = String(raw ?? '').trim();
	if (custom) return resolve(custom);
	return join(process.cwd(), 'data', 'backups');
}

export function folioBackupKeep(raw = env.BACKUP_KEEP) {
	const n = Number.parseInt(String(raw ?? ''), 10);
	if (!Number.isFinite(n)) return 14;
	return Math.min(90, Math.max(1, n));
}

export function folioBackupCron(raw = env.BACKUP_CRON) {
	const cron = String(raw ?? '').trim();
	if (/^(\S+\s+){4}\S+$/.test(cron)) return cron;
	return '0 3 * * *';
}

export function folioBackupOff(raw = env.BACKUP_OFF) {
	const v = String(raw ?? '')
		.trim()
		.toLowerCase();
	return v === '1' || v === 'true' || v === 'off';
}

export function isFolioBackupName(name: string) {
	return FOLIO_BACKUP_NAME.test(name);
}

export function folioBackupName(at = new Date()) {
	const parts = new Intl.DateTimeFormat('sv-SE', {
		timeZone: 'Europe/Bratislava',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	}).formatToParts(at);
	const get = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find((part) => part.type === type)?.value ?? '00';
	return `fond-${get('year')}-${get('month')}-${get('day')}T${get('hour')}-${get('minute')}-${get('second')}.sql`;
}

export function folioBackupStamp(name: string) {
	const match = name.match(/^fond-(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})\.sql$/);
	if (!match) return '';
	return `${match[3]}.${match[2]}.${match[1]} · ${match[4]}:${match[5]}`;
}

export function folioBackupBytesLabel(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
	return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

export function backupsToPrune(names: string[], keep: number) {
	const valid = names.filter(isFolioBackupName).sort().reverse();
	if (keep < 1) return valid;
	return valid.slice(keep);
}

export function folioBackupFile(name: string) {
	if (!isFolioBackupName(name)) return null;
	const dir = resolve(folioBackupDir());
	const dest = resolve(dir, name);
	const prefix = dir.endsWith(sep) ? dir : `${dir}${sep}`;
	if (!dest.startsWith(prefix)) return null;
	return dest;
}

export function sanitizeDumpError(message: string) {
	return message
		.replace(/postgres:\/\/[^@\s]+@/gi, 'postgres://***@')
		.replace(/password[=:]\S+/gi, 'password=***')
		.slice(0, 280);
}

export async function listFolioBackups(limit = 14): Promise<FolioBackupSlip[]> {
	let names: string[] = [];
	try {
		names = await readdir(folioBackupDir());
	} catch {
		return [];
	}

	const slips: FolioBackupSlip[] = [];
	for (const name of names) {
		if (!isFolioBackupName(name)) continue;
		try {
			const info = await stat(join(folioBackupDir(), name));
			if (!info.isFile()) continue;
			slips.push({ name, bytes: info.size, at: info.mtime });
		} catch {
			// Slip already left the shelf.
		}
	}

	slips.sort((a, b) => b.name.localeCompare(a.name));
	return slips.slice(0, Math.max(1, limit));
}

export async function runFolioBackup(at = new Date()): Promise<FolioBackupReport> {
	const dir = folioBackupDir();
	await mkdir(dir, { recursive: true });
	const file = folioBackupName(at);
	const dest = join(dir, file);
	const via = dumpDatabase(dest);
	const info = statSync(dest);
	const leftovers = backupsToPrune(await readdir(dir), folioBackupKeep());
	for (const name of leftovers) {
		try {
			await unlink(join(dir, name));
		} catch {
			// Older dump may already be gone.
		}
	}
	return { ok: true, file, bytes: info.size, kept: folioBackupKeep(), via };
}

function dumpDatabase(dest: string): 'pg_dump' | 'docker' {
	const url = env.DATABASE_URL?.trim();
	if (!url) throw new Error('DATABASE_URL chýba. Zálohu neviem stiahnuť.');

	let last = '';

	if (hasBinary('pg_dump')) {
		try {
			writeDump('pg_dump', ['--no-owner', '--no-acl', `--dbname=${url}`], dest);
			assertDump(dest);
			return 'pg_dump';
		} catch (err) {
			last = err instanceof Error ? sanitizeDumpError(err.message) : '';
			safeUnlink(dest);
			if (!isLocalPostgres(url)) throw err;
		}
	}

	if (isLocalPostgres(url)) {
		try {
			writeDump(
				'docker',
				[
					'compose',
					'exec',
					'-T',
					'postgres',
					'pg_dump',
					'-U',
					'spst',
					'-d',
					'spst',
					'--no-owner',
					'--no-acl'
				],
				dest,
				process.cwd()
			);
			assertDump(dest);
			return 'docker';
		} catch (err) {
			last = err instanceof Error ? sanitizeDumpError(err.message) : last;
			safeUnlink(dest);
		}

		try {
			writeDump(
				'docker',
				[
					'exec',
					'-i',
					'spst-postgres-1',
					'pg_dump',
					'-U',
					'spst',
					'-d',
					'spst',
					'--no-owner',
					'--no-acl'
				],
				dest
			);
			assertDump(dest);
			return 'docker';
		} catch (err) {
			last = err instanceof Error ? sanitizeDumpError(err.message) : last;
			safeUnlink(dest);
		}
	}

	throw new Error(
		last
			? `Záloha neprešla. ${last}`
			: 'pg_dump ani Docker Postgres som nenašiel. Záloha ostala prázdna.'
	);
}

function writeDump(cmd: string, args: string[], dest: string, cwd?: string) {
	const fd = openSync(dest, 'w');
	try {
		const result = spawnSync(cmd, args, {
			cwd,
			env: process.env,
			stdio: ['ignore', fd, 'pipe'],
			timeout: 120_000
		});
		if (result.error) throw result.error;
		if (result.status !== 0) {
			const err = result.stderr?.toString('utf8') ?? '';
			throw new Error(sanitizeDumpError(err || `exit ${result.status}`));
		}
	} finally {
		closeSync(fd);
	}
}

function assertDump(dest: string) {
	const info = statSync(dest);
	if (info.size < 80) throw new Error('Dump je prázdny.');
}

function hasBinary(bin: string) {
	const probe = spawnSync(bin, ['--version'], { encoding: 'utf8', timeout: 4000 });
	return probe.status === 0 && !probe.error;
}

function isLocalPostgres(url: string) {
	try {
		const parsed = new URL(url);
		return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
	} catch {
		return false;
	}
}

function safeUnlink(dest: string) {
	try {
		unlinkSync(dest);
	} catch {
		// Incomplete dump can stay missing.
	}
}
