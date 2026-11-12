/* ─────────────────────────────────────────────────────────────
   config/brand.js — product identity + feature flags.
   Set demoMode:false to hide the role switcher, /demo, the
   "Demo data" labels' switch controls and the developer console.
   ───────────────────────────────────────────────────────────── */
window.SG_BRAND = {
  name: 'SafeGrid',
  tagline: 'Know your corridor before your trucks do.', // client to confirm
  demoMode: true,
  orgName: 'Apex Logistics Ltd',          // placeholder organisation
  timezone: 'Africa/Lagos',
  tzLabel: 'WAT',
  emergencyNumber: '112',                 // configurable; Nigeria national emergency line
  controlDeskNumber: '+234 800 000 0000', // placeholder, client to confirm
  supportEmail: 'support@safegrid.example', // placeholder, client to confirm
  disclaimer:
    'SafeGrid communicates reported information and helps drivers raise alerts. Absence of reports does not imply absence of incidents or a guarantee of road safety.',
  notEmergency:
    'SafeGrid is not an emergency service. In danger, call the emergency number.',
};

/* Design tokens, locked. Mirrored as CSS variables in src/styles.css */
window.SG_THEME = {
  light: {
    ink: '#0E0E12', violet: '#6A3DF5', lime: '#C8F23C', danger: '#F04848', amber: '#E8A317',
    surface: '#FFFFFF', canvas: '#F4F4F6', line: '#E7E7EC', muted: '#6B6B78',
  },
  dark: {
    ink: '#EDEDF2', violet: '#8B6BFF', lime: '#C8F23C', danger: '#FF5C5C', amber: '#F2B53A',
    surface: '#141419', canvas: '#0B0B10', line: '#26262F', muted: '#9A9AA8',
  },
  radius: { sm: 10, md: 14, lg: 18, xl: 20 },
  font: { sans: 'Geist', mono: 'Geist Mono' },
};
