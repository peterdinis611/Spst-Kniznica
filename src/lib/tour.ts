import type { DriveStep } from 'driver.js';

export const TOUR_KEY = 'spst-kniznica-tour';

const steps: DriveStep[] = [
	{
		element: '[data-tour="brand"]',
		popover: {
			title: 'SPŠT knižnica',
			description:
				'Školský fond učebníc a literatúry. 21 dní, naraz najviac 5 kníh. Pavilón B, Po—Pia 7:30—15:30.',
			side: 'right',
			align: 'start'
		}
	},
	{
		element: '[data-tour="nav"]',
		popover: {
			title: 'Fond',
			description: 'Objavovať, odbory, katalóg a autori. Moje knihy sú tvoje výpožičky.',
			side: 'right',
			align: 'start'
		}
	},
	{
		element: '[data-tour="search"]',
		popover: {
			title: 'Hľadanie',
			description: 'Názov, autor alebo signatúra. Na stránke autorov hľadá mená. Ďalšie pole na stránke nie je.',
			side: 'bottom',
			align: 'center'
		}
	},
	{
		element: '[data-tour="featured"]',
		popover: {
			title: 'Dnes na pulte',
			description: 'Odporúčaný zväzok z fondu. Otvor kartu a uvidíš, či je voľný.',
			side: 'bottom',
			align: 'start'
		}
	},
	{
		element: '[data-tour="odbory"]',
		popover: {
			title: 'Police podľa odboru',
			description: 'INF, MAT, STR… Ťukni na značku a ideš rovno na policu svojho smeru.',
			side: 'bottom',
			align: 'start'
		}
	},
	{
		element: '[data-tour="shelf"]',
		popover: {
			title: 'Voľné na polici',
			description: 'Chrbtice, ktoré si môžeš požičať hneď. Celý katalóg je o krok ďalej.',
			side: 'top',
			align: 'start'
		}
	},
	{
		element: '[data-tour="account"]',
		popover: {
			title: 'Účet',
			description: 'Prihlás sa, potom berieš knihy na 21 dní. Téma je vedľa — svetlá alebo tmavá.',
			side: 'bottom',
			align: 'end'
		}
	}
];

export async function startTour(onDone?: () => void) {
	const present = steps.filter((step) => {
		if (!step.element || typeof step.element !== 'string') return true;
		return Boolean(document.querySelector(step.element));
	});

	if (present.length === 0) return;

	const [{ driver }] = await Promise.all([
		import('driver.js'),
		import('driver.js/dist/driver.css'),
		import('./tour.css')
	]);

	const tour = driver({
		showProgress: true,
		animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
		overlayOpacity: 0.52,
		stagePadding: 12,
		stageRadius: 18,
		popoverOffset: 16,
		popoverClass: 'folio-tour',
		nextBtnText: 'Ďalej',
		prevBtnText: 'Späť',
		doneBtnText: 'Hotovo',
		progressText: '{{current}} / {{total}}',
		steps: present,
		onDestroyed: () => onDone?.()
	});

	tour.drive();
}

export function hasSeenTour() {
	return localStorage.getItem(TOUR_KEY) === '1';
}

export function markTourSeen() {
	localStorage.setItem(TOUR_KEY, '1');
}
