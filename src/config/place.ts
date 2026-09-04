export const LIBRARY_PLACE = {
	name: 'SPŠT knižnica',
	pavilion: 'Pavilón B',
	floor: '1. poschodie',
	hours: 'Po—Pia 7:30—15:30',
	street: 'Komenského 5',
	city: 'Bardejov',
	zip: '085 42',
	lat: 49.29056,
	lon: 21.26969,
	site: 'https://www.spsbj.sk'
} as const;

const addressQuery = encodeURIComponent(
	`${LIBRARY_PLACE.street}, ${LIBRARY_PLACE.zip} ${LIBRARY_PLACE.city}`
);

export const LIBRARY_OSM_LINK = `https://www.openstreetmap.org/search?query=${addressQuery}#map=18/${LIBRARY_PLACE.lat}/${LIBRARY_PLACE.lon}`;
