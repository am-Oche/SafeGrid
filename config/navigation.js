/* ─────────────────────────────────────────────────────────────
   config/navigation.js — every sidebar item, role, tab bar and
   page tab is defined here. Rename, reorder, add or remove in one
   place. `phase` marks when a page ships (1 = live now).
   ───────────────────────────────────────────────────────────── */
window.SG_NAV = {
  roles: {
    dispatcher:     { label: 'Dispatcher',              short: 'Dispatcher',  home: '/overview', icon: 'headset',    blurb: 'Runs today’s trips, briefings and the SOS desk.' },
    driver:         { label: 'Driver',                  short: 'Driver',      home: '/driver',   icon: 'smartphone', blurb: 'Phone app: briefing, 1-tap check-in, report, SOS.' },
    org_admin:      { label: 'Organisation Admin',      short: 'Org admin',   home: '/overview', icon: 'building',   blurb: 'Everything a dispatcher sees, plus users, rules and audit.' },
    platform_admin: { label: 'SafeGrid Platform Admin', short: 'Platform',    home: '/admin',    icon: 'shield-check', blurb: 'Organisations, incident moderation, platform health.' },
  },

  groups: [
    { id: 'ops',   label: 'Operations' },
    { id: 'intel', label: 'Intelligence & Safety' },
    { id: 'admin', label: 'Administration' },
  ],

  items: [
    { id: 'overview',     label: 'Operations Overview',     short: 'Overview',  icon: 'layout-grid',    path: '/overview',     group: 'ops',   roles: ['dispatcher', 'org_admin'], phase: 1 },
    { id: 'map',          label: 'Live Fleet & Map',        short: 'Map',       icon: 'map',            path: '/map',          group: 'ops',   roles: ['dispatcher', 'org_admin'], phase: 2 },
    { id: 'trips',        label: 'Trips & Briefings',       short: 'Trips',     icon: 'route',          path: '/trips',        group: 'ops',   roles: ['dispatcher', 'org_admin'], phase: 2 },
    { id: 'fleet',        label: 'Fleet & Drivers',         short: 'Fleet',     icon: 'truck',          path: '/fleet',        group: 'ops',   roles: ['dispatcher', 'org_admin'], phase: 1 },
    { id: 'incidents',    label: 'Corridor Incidents',      short: 'Incidents', icon: 'triangle-alert', path: '/incidents',    group: 'intel', roles: ['dispatcher', 'org_admin', 'platform_admin'], phase: 2 },
    { id: 'sos',          label: 'Emergency SOS Log',       short: 'SOS',       icon: 'siren',          path: '/sos',          group: 'intel', roles: ['dispatcher', 'org_admin'], phase: 2, badge: 'sosOpen' },
    { id: 'exports',      label: 'Exports & Reports',       short: 'Exports',   icon: 'file-down',      path: '/exports',      group: 'intel', roles: ['dispatcher', 'org_admin'], phase: 3 },
    { id: 'intelligence', label: 'SafeGrid Intelligence',   short: 'Intel',     icon: 'sparkles',       path: '/intelligence', group: 'intel', roles: ['dispatcher', 'org_admin'], phase: 3 },
    { id: 'settings',     label: 'Settings',                short: 'Settings',  icon: 'settings',       path: '/settings',     group: 'admin', roles: ['org_admin'], phase: 3 },
    { id: 'admin',        label: 'Platform Admin',          short: 'Platform',  icon: 'building-2',     path: '/admin',        group: 'admin', roles: ['platform_admin'], phase: 3 },
    { id: 'developer',    label: 'Developer console',       short: 'Console',   icon: 'terminal',       path: '/developer',    group: 'admin', roles: ['platform_admin', 'dispatcher', 'org_admin'], phase: 3, demoOnlyForNonPlatform: true },
    { id: 'driver',       label: 'Driver app',              short: 'Driver',    icon: 'smartphone',     path: '/driver',       group: 'ops',   roles: ['driver'], phase: 2 },
  ],

  /* Phone bottom tab bar (max 4 + "More") */
  mobileTabs: {
    dispatcher:     ['overview', 'map', 'trips', 'sos'],
    org_admin:      ['overview', 'fleet', 'trips', 'settings'],
    platform_admin: ['admin', 'incidents', 'developer'],
    driver:         ['driver'],
  },

  /* In-page tabs, keyed by page id. Order = display order. */
  tabs: {
    fleet: [
      { id: 'vehicles',   label: 'Vehicles' },
      { id: 'drivers',    label: 'Drivers' },
      { id: 'recipients', label: 'SOS recipients' },
    ],
    overviewTrips: [
      { id: 'active',  label: 'On route' },
      { id: 'pending', label: 'Awaiting ack' },
      { id: 'all',     label: 'All today' },
    ],
  },
};
