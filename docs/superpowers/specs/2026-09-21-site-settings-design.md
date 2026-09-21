# Site Settings (Color Theme) — Design

## Purpose

Give admins a Settings page in the admin panel to control the public website's
color palette (primary, secondary, hover, text, heading, background) without
touching code or redeploying. Changes take effect live: the next page load of
the public site reflects the saved colors.

## Scope

- One new singleton `SiteSettings` row in the backend database.
- One public read endpoint and one admin-protected write endpoint.
- One new admin page with a color-picker form.
- One small integration point in the public frontend's root layout that
  overrides CSS custom properties at request time.

Out of scope: a full site-wide audit/rewrite of every hardcoded color in the
Sass source, theming beyond the six fields below, and any UI test framework
(none exists in this repo today — verification is manual in-browser).

## Data model

New Prisma model in `backend/prisma/schema.prisma`, always accessed by the
fixed id `1` (singleton pattern — no admin UI ever creates a second row):

```prisma
model SiteSettings {
  id              Int      @id @default(1)
  primaryColor    String   @default("#02092c")
  secondaryColor  String   @default("#0c1e21")
  hoverColor      String   @default("#364e52")
  textColor       String   @default("#364e52")
  headingColor    String   @default("#0c1e21")
  backgroundColor String   @default("#d8e5e5")
  updatedAt       DateTime @updatedAt
}
```

Defaults mirror the current hardcoded values in
`src/app/assets/sass/utilities/_colors.scss` (`theme.primary`, `theme.dark`,
`theme.dark-3`, `text.body`, `heading.primary`, `theme.bg` respectively), so a
freshly-seeded row changes nothing until an admin edits it.

## Backend API

Two new route files, registered in `backend/src/app.js` alongside the
existing routers:

- `GET /api/settings` — public, no auth (colors are not sensitive). Uses
  `prisma.siteSettings.upsert({ where: { id: 1 }, update: {}, create: {} })`
  so the row is lazily created with defaults on first call — no seed script
  needed.
- `PUT /api/admin/settings` — protected by the existing `requireAdmin`
  middleware (same pattern as `adminMessages.js`). Validates every field
  against `/^#[0-9A-Fa-f]{6}$/` before writing; responds `400` with a field
  name on the first invalid value. On success, upserts id `1` and returns the
  saved row.

Both routers hit Prisma directly from the route file, matching the existing
`adminMessages.js` style (no separate service/controller layer in this repo).

## Admin UI

New page at `admin/src/app/settings/page.js`, following the structure already
used by `admin/src/app/messages/page.js`:

- Wrapped in `<RequireAuth>`.
- `<Breadcrumbs items={[{ label: "Settings" }]} />` + page-header.
- On mount, `apiFetch("/api/settings")` loads current values into
  `useState`; `null` state renders a loading skeleton, matching the existing
  pattern.
- One form, no table (singleton, not a list). Six fields, each rendered as a
  paired `<input type="color">` (native picker) + text `<input>` showing/
  editing the hex value, kept in sync in both directions, plus a small
  preview swatch next to each row.
- Save button calls `apiFetch("/api/admin/settings", { method: "PUT", body })`.
  Inline success/error message under the form, matching the
  `{error ? <p className="error">...}` convention used elsewhere in admin.

## Frontend integration

- New `src/libs/settingsApi.js` exporting `getSiteSettings()`: a server-side
  `fetch(`${BACKEND_URL}/api/settings`, { cache: "no-store" })` that returns
  the parsed settings object, or `null` on any error (network failure,
  non-200, bad JSON) — never throws.
- `src/app/layout.js` (already a server component) calls `getSiteSettings()`
  and, when it returns non-null, renders an inline `<style>` tag in `<head>`:

  ```
  :root {
    --tj-color-theme-primary: <primaryColor>;
    --tj-color-theme-secondary: <secondaryColor>;
    --tj-color-theme-hover: <hoverColor>;
    --tj-color-text-body: <textColor>;
    --tj-color-heading-primary: <headingColor>;
    --tj-color-theme-bg: <backgroundColor>;
  }
  ```

  `--tj-color-theme-primary`, `--tj-color-text-body`, `--tj-color-heading-primary`,
  and `--tj-color-theme-bg` already exist (compiled from the Sass color map)
  and are consumed throughout the site's SCSS, so overriding them at the
  `:root` level takes effect immediately via normal CSS cascade rules —
  no rebuild required.
  `--tj-color-theme-secondary` and `--tj-color-theme-hover` are new variables.
  Implementation will grep existing `:hover` rules in the SCSS source and
  repoint the highest-impact ones (primary nav links, buttons, primary CTAs)
  to `var(--tj-color-theme-hover)`; a full site-wide rewrite of every hover
  rule is explicitly out of scope.
- If `getSiteSettings()` returns `null` (backend unreachable, etc.), no
  override `<style>` tag is rendered and the site silently falls back to its
  normal build-time Sass colors.

## Error handling

- Backend: invalid hex on PUT → `400` naming the offending field; missing/
  invalid admin session on PUT → `401`, matching existing `requireAdmin`
  behavior.
- Frontend: settings fetch failure is swallowed in `getSiteSettings()` and
  degrades to default colors — the public site must never fail to render
  because the settings endpoint is down.
- Admin UI: load failure and save failure both surface as an inline error
  message; save failure leaves the form populated with the user's edits
  (not reset) so they don't lose their input.

## Testing

- Backend: supertest tests (matching existing style under `backend/src`)
  covering: `GET` returns defaults on first call and persists across calls;
  `PUT` updates and is reflected by a subsequent `GET`; `PUT` rejects an
  invalid hex value; `PUT` without an admin session is rejected.
- Admin/frontend: no UI test framework exists in this repo today. Verified
  manually in-browser: load the settings page, change colors, save, then
  load the public site and confirm the new colors render.
