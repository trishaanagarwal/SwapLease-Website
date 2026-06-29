// Premium brand design tokens (navy + forest green + gold), matching the logo.
// Token NAMES are kept stable so existing pages recolor automatically;
// only the VALUES changed from the old warm/coral scheme.
export const t = {
  cream: '#F8F6F1',      // ivory page background
  creamDeep: '#F1ECE3',  // slightly deeper ivory for alt sections
  card: '#FFFFFF',
  ink: '#16223B',        // deep navy-charcoal text
  inkSoft: '#586079',    // muted slate
  inkFaint: '#9AA0B0',
  border: '#E7E3DA',
  borderStrong: '#D9D3C6',

  // "coral" slot now holds the PRIMARY navy (matches logo) so all buttons update
  coral: '#1B3A6B',      // brand navy (primary)
  coralDeep: '#122A52',  // darker navy (hover)
  coralTint: '#E8EDF6',  // pale navy wash

  // secondary = logo's forest/pine green
  sage: '#1C4D3E',
  sageTint: '#E2ECE6',

  // refined plum kept for variety
  plum: '#4B3F72',
  plumTint: '#ECE8F4',

  // accent = luxury gold
  honey: '#C0934A',
  honeyTint: '#F4EBD7',

  // brand raw values for gradients
  navy: '#1B3A6B',
  navyDeep: '#102A52',
  green: '#1C4D3E',
  gold: '#C0934A',

  shadowSm: '0 1px 2px rgba(16, 28, 56, 0.06)',
  shadow: '0 8px 30px rgba(16, 28, 56, 0.10)',
  shadowLg: '0 24px 60px rgba(16, 28, 56, 0.16)',
  shadow3d: '0 30px 60px -20px rgba(16, 28, 56, 0.35), 0 12px 24px -12px rgba(16, 28, 56, 0.25)',

  radius: 18,
  radiusLg: 26,
  pill: 999,

  display: "'Fraunces', Georgia, serif",
};

export const typeLabels = {
  apartment: 'Apartment',
  house: 'House',
  studio: 'Studio',
  student_accom: 'Student Accom',
};
