import type { DriveStep } from 'driver.js';

export const TOUR_KEY = 'spst-kniznica-tour';

export const deskSteps: DriveStep[] = [
	{
		element: '[data-tour="brand"]',
		popover: {
			title: 'SPŠT knižnica',
			description:
				'Školský fond učebníc a literatúry. 21 dní, bez stropu na počet kníh. Pavilón B, Po—Pia 7:30—15:30.',
			side: 'right',
			align: 'start'
		}
	},
	{
		element: '[data-tour="nav"]',
		popover: {
			title: 'Fond',
			description:
				'Objavovať, odbory, katalóg a autori. Moje knihy sú výpožičný lístok — koľko treba, každá na 21 dní.',
			side: 'right',
			align: 'start'
		}
	},
	{
		element: '[data-tour="search"]',
		popover: {
			title: 'Hľadanie',
			description:
				'Názov, autor alebo signatúra. Na stránke autorov hľadá mená. Ďalšie pole na stránke nie je.',
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
			description: 'Otoč zväzky na polici a vyber knihu, ktorú si môžeš požičať hneď.',
			side: 'top',
			align: 'start'
		}
	},
	{
		element: '[data-tour="account"]',
		popover: {
			title: 'Preukaz',
			description:
				'Kruh s iniciálami otvorí lístok: meno, číslo preukazu, Moje knihy a odhlásenie. Hosť tam vidí Prihlásiť sa. Téma je vedľa.',
			side: 'bottom',
			align: 'end'
		}
	}
];

export const docsSteps: DriveStep[] = [
	{
		element: '[data-tour="docs-mark"]',
		popover: {
			title: 'Príručka fondu',
			description:
				'Toto nie je katalóg. Je to interný zošit pultu — ako hľadať, požičať a vrátiť. Značka SPŠT ťa vráti do siene.',
			side: 'bottom',
			align: 'start'
		}
	},
	{
		element: '[data-tour="docs-chapters"]',
		popover: {
			title: 'Kapitoly',
			description:
				'Osem listov: katalóg, register, odbory, výpožičky, účet, pult a otázky. Na telefóne ich otvoríš tlačidlom Kapitoly.',
			side: 'right',
			align: 'start'
		}
	},
	{
		element: '[data-tour="docs-leaf"]',
		popover: {
			title: 'List',
			description:
				'Čítaš jednu kapitolu. Dole sú odkazy Predchádzajúca a Ďalšia — listuj ako v zošite, nie v menu fondu.',
			side: 'left',
			align: 'start'
		}
	},
	{
		element: '[data-tour="docs-fund"]',
		popover: {
			title: 'Do fondu',
			description:
				'Príručka ostáva v pätičke pultu. Týmto sa vrátiš na Objavovať — hľadať a požičiavať. Prehliadku pultu spustíš v bočnom paneli.',
			side: 'bottom',
			align: 'end'
		}
	}
];

export function tourStepsFor(pathname: string) {
	return pathname.startsWith('/docs') ? docsSteps : deskSteps;
}

export async function startTour(onDone?: () => void) {
	const steps = tourStepsFor(window.location.pathname);
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
		onHighlightStarted: (_element, step) => {
			if (typeof step.element !== 'string') return;
			const btn = document.querySelector<HTMLButtonElement>('.handbook-toc-btn');
			const aside = document.querySelector('.handbook-index');
			if (!btn || !aside) return;
			if (!window.matchMedia('(max-width: 959px)').matches) return;
			const open = aside.classList.contains('is-open');
			const wantOpen = step.element === '[data-tour="docs-chapters"]';
			if (open !== wantOpen) btn.click();
		},
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
