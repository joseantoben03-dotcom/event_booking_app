// Known venue names get a curated accent color. Any venue added purely via
// the database (no code change) falls back to a neutral color, so new
// venues always render correctly without needing a frontend update.
const KNOWN_COLORS = {
  'Main Auditorium': 'indigo',
  'APJ Auditorium': 'blue',
  'MBA Hall': 'amber',
  'Library Hall': 'emerald',
  'Presentation Hall': 'purple',
};

const FALLBACK_COLOR = 'rose';

export function getVenueColor(name) {
  return KNOWN_COLORS[name] || FALLBACK_COLOR;
}

// Attaches display metadata (color, description) to a plain { id, name }
// venue row fetched from the API.
export function withVenueStyle(venue) {
  return {
    ...venue,
    color: getVenueColor(venue.name),
    description: venue.description || 'Available for booking',
  };
}
