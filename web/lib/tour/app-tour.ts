"use client";

import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

export const TOUR_SEEN_KEY = "spst-app-tour-seen";

const CANDIDATE_STEPS: Array<DriveStep & { element: string }> = [
  {
    element: '[data-tour="brand"]',
    popover: {
      title: "SPST Knižnica",
      description:
        "Školský fond SPST — odtiaľto sa vždy vrátiš na úvodnú stránku.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="nav"]',
    popover: {
      title: "Navigácia",
      description:
        "Katalóg kníh, autori, kategórie a (po prihlásení) výpožičný pult.",
      side: "bottom",
      align: "center",
    },
  },
  {
    element: '[data-tour="catalog-search"]',
    popover: {
      title: "Vyhľadávanie",
      description:
        "Hľadaj podľa názvu, autora alebo témy. Výsledky sa filtrujú naživo.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="books-facets"]',
    popover: {
      title: "Filtre fondu",
      description:
        "Kategóriu a dostupnosť prepneš jedným klikom. Autor a trakt sú v dialógu.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="authors-alphabet"]',
    popover: {
      title: "Autori",
      description:
        "Abecedné filtre a karty autorov — otvor profil a uvidíš tituly vo fonde.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="categories-register"]',
    popover: {
      title: "Kategórie",
      description:
        "Tematické rady fondu. Každá kategória má vlastnú stránku s knihami.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: '[data-tour="theme"]',
    popover: {
      title: "Svetlo / tma",
      description: "Prepni vzhľad podľa prostredia — tokeny ostávajú konzistentné.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="auth"]',
    popover: {
      title: "Prihlásenie",
      description:
        "Školský účet (Entra) otvorí rezervácie a výpožičný pult pod tvojím menom.",
      side: "bottom",
      align: "end",
    },
  },
  {
    element: '[data-tour="tour-trigger"]',
    popover: {
      title: "Prehliadka kedykoľvek",
      description:
        "Tento sprievodca môžeš spustiť znova tlačidlom Prehliadka v hlavičke.",
      side: "bottom",
      align: "end",
    },
  },
];

export function markTourSeen() {
  try {
    window.localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function hasSeenTour(): boolean {
  try {
    return window.localStorage.getItem(TOUR_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

let activeTour: ReturnType<typeof driver> | null = null;

/** Destroy leftover overlay (e.g. after navigation). */
export function destroyAppTour() {
  if (!activeTour) return;
  try {
    activeTour.destroy();
  } catch {
    /* ignore */
  }
  activeTour = null;
  document.querySelectorAll(".driver-overlay, .driver-active-element, .driver-popover").forEach((el) => {
    el.remove();
  });
  document.body.classList.remove("driver-active");
}

export function startAppTour() {
  if (typeof window === "undefined") return;

  destroyAppTour();

  const steps = CANDIDATE_STEPS.filter((step) =>
    Boolean(document.querySelector(step.element)),
  );

  if (steps.length === 0) return;

  activeTour = driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    overlayOpacity: 0.55,
    stagePadding: 10,
    stageRadius: 2,
    popoverClass: "spst-driver-theme",
    nextBtnText: "Ďalej",
    prevBtnText: "Späť",
    doneBtnText: "Hotovo",
    progressText: "{{current}} / {{total}}",
    steps,
    onDestroyed: () => {
      activeTour = null;
      markTourSeen();
    },
  });

  activeTour.drive();
}
