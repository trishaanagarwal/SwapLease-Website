// Shared design tokens: the landing page's palette (off-white, near-black ink, green accent) and Outfit type.
// Token NAMES are kept stable so existing pages recolor automatically.
export const t = {
  cream: '#F8F8F8',
  creamDeep: '#EEEEEE',
  card: '#FFFFFF',
  ink: '#0A0A0A',
  inkSoft: '#5A5A5A',
  inkFaint: '#8E8E8E',
  border: '#E3E3E3',
  borderStrong: '#D0D0D0',

  // "coral" slot holds the primary navy so existing buttons recolor
  coral: '#1F6B3A',
  coralDeep: '#17522C',
  coralTint: '#E7F0EA',

  sage: '#1F6B3A',
  sageTint: '#E7F0EA',

  plum: '#4B3F72',
  plumTint: '#ECE8F4',

  honey: '#B08433',
  honeyTint: '#F2EAD9',

  navy: '#1F6B3A',
  navyDeep: '#17522C',
  green: '#1F6B3A',
  gold: '#B08433',

  shadowSm: '0 1px 2px rgba(10, 10, 10, 0.05)',
  shadow: '0 4px 16px rgba(10, 10, 10, 0.07)',
  shadowLg: '0 10px 30px rgba(10, 10, 10, 0.10)',
  shadow3d: '0 10px 30px rgba(10, 10, 10, 0.10)', // alias (kept for compatibility)

  radiusSm: 6,
  radius: 8,
  radiusLg: 12,
  pill: 999,

  display: "'Outfit', system-ui, sans-serif",
};

export const typeLabels = {
  apartment: 'Apartment',
  house: 'House',
  studio: 'Studio',
  student_accom: 'Student Accom',
};
