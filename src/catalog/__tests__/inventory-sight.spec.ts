import { describe, expect, it } from 'vitest';
import { inventorySight } from '../inventory-sight';

describe('inventorySight', () => {
	it('keeps copies on loan off the missing list', () => {
		expect(inventorySight({ status: 'loaned', runId: 'run-1', markedRunId: null })).toBe('out');
	});

	it('marks an unscanned free copy as missing once a walk is open', () => {
		expect(inventorySight({ status: 'available', runId: 'run-1', markedRunId: null })).toBe('missing');
		expect(inventorySight({ status: 'available', runId: 'run-1', markedRunId: 'run-1' })).toBe('found');
	});

	it('does not cry missing when no walk is open', () => {
		expect(inventorySight({ status: 'available', runId: null, markedRunId: null })).toBe('found');
	});
});
