// JS mirror of the app palette (src/index.css :root, the landing page's dealt tokens) for the few inline
// styles and icon colours left. Plain hex, so SVG attributes resolve them too. Prefer the CSS classes.
const ink = '#0A0A0A';
const muted = '#6A6A6A';
const action = '#1F6B3A';
const tint = '#E6EEE8';

export const t = {
  cream: '#F8F8F8',
  creamDeep: '#EEEEEE',
  card: '#FFFFFF',
  ink,
  inkSoft: muted,
  inkFaint: '#9A9A9A',
  border: '#E3E3E3',
  borderStrong: '#CFCFCF',

  coral: action, coralDeep: '#185730', coralTint: tint,
  sage: action, sageTint: tint,
  navy: action, navyDeep: '#185730', green: action,
  plum: ink, plumTint: '#EEEEEE',
  honey: '#7A5B17', honeyTint: '#F2EAD9', gold: '#7A5B17',

  shadowSm: 'none',
  shadow: '0 12px 32px -18px rgba(10, 10, 10, 0.35)',
  shadowLg: '0 18px 40px -20px rgba(10, 10, 10, 0.40)',
  shadow3d: '0 18px 40px -20px rgba(10, 10, 10, 0.40)',

  radiusSm: 8,
  radius: 12,
  radiusLg: 20,
  pill: 999,

  display: "'Outfit', system-ui, sans-serif",
};

export const typeLabels = {
  apartment: 'Apartment',
  house: 'House',
  studio: 'Studio',
  student_accom: 'Student accom',
};
