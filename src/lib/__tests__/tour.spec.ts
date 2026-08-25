import { describe, expect, it } from 'vitest';
import { deskSteps, docsSteps, tourStepsFor } from '../tour';

describe('tourStepsFor', () => {
	it('uses the handbook walkthrough on docs routes', () => {
		expect(tourStepsFor('/docs')).toBe(docsSteps);
		expect(tourStepsFor('/docs/pult')).toBe(docsSteps);
	});

	it('uses the desk walkthrough everywhere else', () => {
		expect(tourStepsFor('/discover')).toBe(deskSteps);
		expect(tourStepsFor('/loans')).toBe(deskSteps);
		expect(tourStepsFor('/admin/books')).toBe(deskSteps);
	});

	it('keeps handbook targets on the docs tour', () => {
		const targets = docsSteps.map((step) => step.element);
		expect(targets).toEqual([
			'[data-tour="docs-mark"]',
			'[data-tour="docs-chapters"]',
			'[data-tour="docs-leaf"]',
			'[data-tour="docs-fund"]'
		]);
	});
});
