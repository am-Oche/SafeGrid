# SafeGrid — Step 0 Audit

> **Note on inputs.** Fleet.zip (40 images) was received and studied. The HTML prototype
> (`safegrid_b2b_fleet_mvp.html`) arrived **empty** — no text content came through. The
> feature inventory below is therefore reconstructed from the written brief, which names
> every tab, modal, role, button and wording. Please re-attach the prototype so section A
> can be diffed line-by-line against it.

---

## A. Prototype inventory (from brief)

### Roles
| Role | Scope |
|---|---|
| Dispatcher | Operations, trips, briefings, map, SOS desk, exports |
| Driver | Phone app: trip, briefing ack, check-in, report incident, SOS |
| Organisation Admin | Everything a dispatcher sees + Settings (users, roles, corridors, rules, integrations, audit) |
| SafeGrid Platform Admin | Organisations, incident moderation queue, platform health, developer console |

### Tabs (original prototype order)
1. Operations Overview
2. Live Fleet & Map
3. Trips & Route Risk Briefings
4. Fleet & Drivers
5. Corridor Incidents
6. Emergency SOS Log
7. Corridor Exports & CSV
8. "Opus 5.5 AI Engine" → **renamed SafeGrid Intelligence**, model names and invented stats removed
9. Settings
10. Platform Admin

### Modals / overlays
- Create New Trip & Briefing (wizard: corridor → vehicle → driver → departure → briefing → Acknowledge & Dispatch)
- Submit Incident Report (category, location, description, photo)
- Mark SOS Resolved (required note)
- Add Vehicle / Add Driver
- Inspect trip (detail + check-in timeline)
- Dispatch Action (from map context card)
- Moderation: Verify / Reject / Merge
- Webhook test, offline queue flush (developer console)

### Buttons & actions
Inspect · Acknowledge · Why am I seeing this? · Dispatch Action · Create New Trip & Briefing · Acknowledge & Dispatch · Submit Incident Report · Verify / Reject / Merge · Mark Resolved · Send test (simulated) · Export CSV · Print summary · Approve / Review / Dismiss · 1-Tap Check-In · Report Road Incident · SOS (hold 1.5 s) · Cancel · Call control desk · Reset demo data · Night shift toggle · Demo mode role switch

### Rules & statuses
- Briefing: Draft → Sent → Acknowledged → Expired
- Incident: Pending Verification → Verified / Rejected / Expired. New reports default to Pending.
- SOS delivery per recipient: Queued → Sent → Delivered / Failed. Never say "alerted" without a delivery state.
- Coverage disclaimer shown wherever intelligence appears.
- Freshness ("Updated HH:MM WAT") + source on every incident.
- Missed check-in threshold (configurable, default 45 min).
- Not an emergency service: configurable emergency number, tap-to-call.

---

## B. Fleet.zip — useful screen types

| # | Screen type | What we take |
|---|---|---|
| 1 | Morning dashboard + AI brief | Greeting in Light weight, tiny caps breadcrumb, KPI strip in one card split by hairlines, violet brief card with "why" bars + proposed actions |
| 2 | Exceptions ranked by cost | Severity chip · time · ID · issue · impact · recommendation · owner · status; ranked top-down |
| 3 | Shipments table | Dense rows, mono IDs, pill status, avatar + name |
| 4 | Live tracking map + timeline | Left list, centre map with route lines + ETA bubbles, right context card, timeline strip under map |
| 5 | Vehicle cards with health | Image header, "Health 72" chip, plate big, 3 mini-stats (fuel/odometer/service), location footer |
| 6 | AI agents page | Dark summary banner, agent cards with counts, autonomy level, off switch |
| 7 | Dispatch board (tablet) | Queue left, map centre, approval cards right |
| 8 | Approval card | "AI proposes. A person approves." Current vs proposed, impact rows, Reject / Review details / Approve |
| 9 | Customer view | Account brief card, opportunity, actions |
| 10 | Settings with roles | Left sub-nav, team table, permissions matrix, audit log |
| 11 | Ask-anything assistant | Side panel, threaded answers with action cards, suggested follow-ups |
| 12 | Mobile home | Greeting, search, 2×2 KPI tiles, needs-attention list, 5-tab bottom bar |
| 13 | Tablet dispatch | Icon rail + three panes |
| 14 | Sign-in + states | Sign in, 2-step, invite, loading, empty, error, no-access, offline |
| 15 | Before/after alerts | Time-ordered noise vs ranked decisions with "Why it is first" |

Visual DNA: soft grey canvas, white 16–20 px cards, hairlines, violet = action + anything the AI did, lime only for good news, red only for what costs money/safety. Geist Light for big numbers, Geist Mono for IDs.

---

## C. Feature → page/component map

| Feature | Lives in |
|---|---|
| Greeting + Morning brief | `pages/overview` → `BriefCard` |
| 4 KPIs (count-up, trend) | `config/dashboard.kpis` → `KpiStrip` |
| Active Trips & Check-ins table + Inspect | `overview` → `TripsTable` → `TripDrawer` |
| Route Risk Alerts (ranked, Acknowledge, Why) | `overview` → `AlertsFeed` |
| Exceptions list | `overview` → `ExceptionsList` (missed check-ins, unacked briefings, service due, open SOS) |
| Shift handover notes (suggestion 4) | `overview` → `HandoverCard` |
| Live map, corridors, markers, clustering, layers, timeline | `pages/map` (P2) |
| Trips table, wizard, briefing, trip detail | `pages/trips` (P2) |
| Convoy mode (suggestion 1) | Trip wizard, multi-vehicle step (P2) |
| Missed check-in warnings (suggestion 2) | `settings.missedCheckInMin` → Exceptions + trip rows (P1), Settings UI (P3) |
| Vehicle cards, driver profiles, add forms | `pages/fleet` tabs Vehicles / Drivers / SOS recipients |
| SOS recipients + Send test (simulated) | `pages/fleet?tab=recipients` |
| Incidents list/map/filters, Submit report, moderation | `pages/incidents` (P2), queue also in `pages/admin` (P3) |
| Incident heatmap by time of day (suggestion 3) | `pages/incidents?tab=patterns` (P2) |
| SOS log, Mark Resolved, red banner | `pages/sos` (P2); banner in shell (P1) |
| Driver app + offline queue + PWA | `/driver` (P2) |
| CSV export, printable summary | `pages/exports` (P3) |
| Weekly corridor report (suggestion 5) | `pages/exports?tab=weekly` (P3) |
| SafeGrid Intelligence, Ask SafeGrid, approval cards | `pages/intelligence` (P3); small approval cards on Fleet (P1) |
| Settings (org, roles matrix, corridors, rules, integrations, audit) | `pages/settings` (P3) |
| Platform admin | `pages/admin` (P3) |
| Simulated backend console | `pages/developer` (P3); latency toggle already in Demo menu (P1) |
| Search, bell, toasts, Cmd+K, states | `components/shell`, `components/ui` |
| Demo role switcher, /demo, Cmd+K "role" | `components/shell` → `DemoSwitcher`, `pages/demo` |
| Landing + /login | `pages/landing` (P3), `pages/login` (P1) |
| Night shift (dark mode) | `ui.theme` in store; toggle in header + Cmd+K |
| Reset demo data | Demo menu + Cmd+K |
