import { holdingLabel } from '$lib/admin';
import { INVENTORY_SIGHT_LABEL, type InventorySight } from '$lib/inventory-sight';
import { toCsv } from '$lib/csv';
import { stampDate } from '$lib/format';
import { toXml } from '$lib/xml';

export type InventoryRow = {
	inventoryNo: string;
	status: string;
	title: string;
	callNumber: string;
	isbn: string;
	year: number;
	categoryName: string;
	categoryCode: string;
	sight: string;
	lastSeenAt: Date | string | null;
};

export type OverdueRow = {
	id: string;
	klass: string;
	firstName: string;
	lastName: string;
	title: string;
	callNumber: string;
	dueAt: Date | string;
	lateDays: number;
};

const XMLNS = 'urn:spst:kniznica:vykaz';

function sightLabel(value: string) {
	return INVENTORY_SIGHT_LABEL[value as InventorySight] ?? value;
}

export function inventoryCsv(rows: InventoryRow[]) {
	return toCsv(
		['inventár', 'stav', 'nález', 'signatúra', 'názov', 'odbor', 'kód', 'isbn', 'rok'],
		rows.map((row) => [
			row.inventoryNo,
			holdingLabel(row.status),
			sightLabel(row.sight),
			row.callNumber,
			row.title,
			row.categoryName,
			row.categoryCode,
			row.isbn,
			row.year
		])
	);
}

export function overdueCsv(rows: OverdueRow[]) {
	return toCsv(
		['trieda', 'meno', 'priezvisko', 'zväzok', 'signatúra', 'termín', 'dni po lehote'],
		rows.map((row) => [
			row.klass,
			row.firstName,
			row.lastName,
			row.title,
			row.callNumber,
			stampDate(row.dueAt),
			row.lateDays
		])
	);
}

export function inventoryXml(rows: InventoryRow[], peciatka: string) {
	return toXml({
		name: 'fond',
		attrs: {
			xmlns: XMLNS,
			druh: 'inventura',
			peciatka,
			pocet: rows.length
		},
		children: rows.map((row) => ({
			name: 'vytlacok',
			children: [
				{ name: 'inventar', text: row.inventoryNo },
				{ name: 'stav', text: holdingLabel(row.status) },
				{ name: 'nalez', text: sightLabel(row.sight) },
				{ name: 'signatura', text: row.callNumber },
				{ name: 'nazov', text: row.title },
				{ name: 'odbor', attrs: { kod: row.categoryCode }, text: row.categoryName },
				{ name: 'isbn', text: row.isbn },
				{ name: 'rok', text: row.year }
			]
		}))
	});
}

export function overdueXml(rows: OverdueRow[], peciatka: string) {
	return toXml({
		name: 'fond',
		attrs: {
			xmlns: XMLNS,
			druh: 'po-lehote',
			peciatka,
			pocet: rows.length
		},
		children: rows.map((row) => ({
			name: 'listok',
			children: [
				{ name: 'trieda', text: row.klass || '—' },
				{ name: 'meno', text: row.firstName },
				{ name: 'priezvisko', text: row.lastName },
				{ name: 'zvazok', text: row.title },
				{ name: 'signatura', text: row.callNumber },
				{ name: 'termin', text: stampDate(row.dueAt) },
				{ name: 'dniPoLehote', text: row.lateDays }
			]
		}))
	});
}
