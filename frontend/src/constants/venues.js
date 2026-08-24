import { LandmarkIcon, BriefcaseIcon, BookOpenIcon, PresentationChartIcon } from '../components/icons/Icons';

// Fixed set of bookable venues. Keep in sync with backend/src/config/venues.js
export const VENUES = [
  { name: 'Main Auditorium', icon: LandmarkIcon, color: 'indigo', description: 'Large-capacity venue for major events and ceremonies' },
  { name: 'APJ Auditorium', icon: LandmarkIcon, color: 'blue', description: 'Mid-size auditorium for seminars and talks' },
  { name: 'MBA Hall', icon: BriefcaseIcon, color: 'amber', description: 'Business school hall for workshops and panels' },
  { name: 'Library Hall', icon: BookOpenIcon, color: 'emerald', description: 'Quiet hall suited for academic sessions' },
  { name: 'Presentation Hall', icon: PresentationChartIcon, color: 'purple', description: 'Equipped for presentations and tech talks' },
];

export const VENUE_NAMES = VENUES.map((v) => v.name);
