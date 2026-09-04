export const LIBRARY_PLACE = {
	name: 'SPŠT knižnica',
	pavilion: 'Pavilón B',
	floor: '1. poschodie',
	hours: 'Po—Pia 7:30—15:30',
	street: 'Hviezdoslavova 6',
	city: 'Spišská Nová Ves',
	zip: '052 01',
	lat: 48.94732,
	lon: 20.56736
} as const;

const bbox = {
	west: LIBRARY_PLACE.lon - 0.0054,
	south: LIBRARY_PLACE.lat - 0.0034,
	east: LIBRARY_PLACE.lon + 0.0054,
	north: LIBRARY_PLACE.lat + 0.0034
};

export const LIBRARY_OSM_EMBED = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.west}%2C${bbox.south}%2C${bbox.east}%2C${bbox.north}&layer=mapnik`;

export const LIBRARY_OSM_LINK = `https://www.openstreetmap.org/?mlat=${LIBRARY_PLACE.lat}&mlon=${LIBRARY_PLACE.lon}#map=17/${LIBRARY_PLACE.lat}/${LIBRARY_PLACE.lon}`;
