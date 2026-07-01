// Shared design tokens (flat, restrained, no gradients, gently softened corners).
// Token NAMES are kept stable so existing pages recolor automatically.
export const t = {
  cream: '#F8F6F1',
  creamDeep: '#F1ECE3',
  card: '#FFFFFF',
  ink: '#16223B',
  inkSoft: '#586079',
  inkFaint: '#9AA0B0',
  border: '#E5E1D8',
  borderStrong: '#D5CFC2',

  // "coral" slot holds the primary navy so existing buttons recolor
  coral: '#1B3A6B',
  coralDeep: '#122A52',
  coralTint: '#ECEFF5',

  sage: '#1C4D3E',
  sageTint: '#E6EDE8',

  plum: '#4B3F72',
  plumTint: '#ECE8F4',

  honey: '#B08433',
  honeyTint: '#F2EAD9',

  navy: '#1B3A6B',
  navyDeep: '#122A52',
  green: '#1C4D3E',
  gold: '#B08433',

  shadowSm: '0 1px 2px rgba(16, 28, 56, 0.05)',
  shadow: '0 4px 16px rgba(16, 28, 56, 0.07)',
  shadowLg: '0 10px 30px rgba(16, 28, 56, 0.10)',
  shadow3d: '0 10px 30px rgba(16, 28, 56, 0.10)', // alias (kept for compatibility)

  radiusSm: 6,
  radius: 8,
  radiusLg: 12,
  pill: 999,

  display: "'Fraunces', Georgia, serif",
};

export const typeLabels = {
  apartment: 'Apartment',
  house: 'House',
  studio: 'Studio',
  student_accom: 'Student Accom',
};
