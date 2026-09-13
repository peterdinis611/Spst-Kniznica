import { describe, expect, it } from 'vitest';
import {
	backupsToPrune,
	folioBackupBytesLabel,
	folioBackupCron,
	folioBackupFile,
	folioBackupKeep,
	folioBackupName,
	folioBackupOff,
	folioBackupStamp,
	isFolioBackupName,
	sanitizeDumpError
} from '../folio-backup';

describe('folio backup slips', () => {
	it('stamps a Bratislava dump name', () => {
		const name = folioBackupName(new Date('2026-09-13T01:00:00.000Z'));
		expect(name).toBe('fond-2026-09-13T03-00-00.sql');
		expect(isFolioBackupName(name)).toBe(true);
		expect(folioBackupStamp(name)).toBe('13.09.2026 · 03:00');
	});

	it('rejects a path that is not a fond dump', () => {
		expect(isFolioBackupName('../secret.sql')).toBe(false);
		expect(isFolioBackupName('fond-2026-09-13.sql')).toBe(false);
		expect(folioBackupStamp('other.sql')).toBe('');
		expect(folioBackupFile('../secret.sql')).toBeNull();
		expect(
			folioBackupFile('fond-2026-09-13T03-00-00.sql')?.endsWith('fond-2026-09-13T03-00-00.sql')
		).toBe(true);
	});

	it('keeps the newest dumps and prunes the rest', () => {
		expect(
			backupsToPrune(
				[
					'fond-2026-09-10T03-00-00.sql',
					'readme.txt',
					'fond-2026-09-12T03-00-00.sql',
					'fond-2026-09-11T03-00-00.sql'
				],
				2
			)
		).toEqual(['fond-2026-09-10T03-00-00.sql']);
		expect(backupsToPrune(['fond-2026-09-13T03-00-00.sql'], 14)).toEqual([]);
	});

	it('clamps how many dumps stay on the shelf', () => {
		expect(folioBackupKeep(undefined)).toBe(14);
		expect(folioBackupKeep('3')).toBe(3);
		expect(folioBackupKeep('0')).toBe(1);
		expect(folioBackupKeep('400')).toBe(90);
	});

	it('reads the night cron and the off stamp', () => {
		expect(folioBackupCron(undefined)).toBe('0 3 * * *');
		expect(folioBackupCron('15 4 * * 1')).toBe('15 4 * * 1');
		expect(folioBackupCron('broken')).toBe('0 3 * * *');
		expect(folioBackupOff('1')).toBe(true);
		expect(folioBackupOff('off')).toBe(true);
		expect(folioBackupOff(undefined)).toBe(false);
	});

	it('labels dump size and hides a connection string', () => {
		expect(folioBackupBytesLabel(400)).toBe('400 B');
		expect(folioBackupBytesLabel(12_288)).toBe('12 kB');
		expect(folioBackupBytesLabel(1_572_864)).toBe('1,5 MB');
		expect(
			sanitizeDumpError('pg_dump: postgres://spst:tajne@localhost:5433/spst failed password=tajne')
		).toBe('pg_dump: postgres://***@localhost:5433/spst failed password=***');
	});
});
