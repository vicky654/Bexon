# News, Webinars/Events and Resources — Design Spec

Date: 2026-09-30
Status: Design approved in chat, awaiting written-spec review
Parent: website transformation, sub-project B (of A–E). Builds on
`2026-09-29-lead-forms-design.md` (lead engine) and the existing Blogs
pattern (Prisma model → public API with local fallback → admin CRUD →
`/blogs`, `/blogs/[slug]`).

## Purpose

The transformation brief lists news, webinars and resource pages as dynamic
sections that must be migrated and managed without code changes, and lists
"Resource downloads" as a lead-generation data collection point. This
sub-project adds all three as admin-managed content, plus two lead types:
webinar registration and gated resource download.

## Content model

One table, `ContentItem`, with a `kind`:

| field | type | notes |
|---|---|---|
| id | Int PK | |
| kind | String | `news` \| `event` \| `resource` |
| title | String | ≤ 200 |
| slug | String | unique per kind (`@@unique([kind, slug])`), `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 120 |
| summary | String | ≤ 300, used on cards and as meta description |
| body | String | rich-text HTML from the admin editor |
| coverImage | String? | `/uploads/...` or https URL |
| published | Boolean | default false |
| publishedAt | DateTime | default now; listing order for news/resources |
| sourceUrl | String? | news only, https |
| startsAt, endsAt | DateTime? | event only; startsAt required for events; endsAt ≥ startsAt |
| format | String? | event only: `online` \| `in_person` |
| venue | String? | event only, ≤ 300 (address or "Zoom link shared on registration") |
| recordingUrl | String? | event only, https |
| resourceType | String? | resource only: `whitepaper` \| `guide` \| `checklist` \| `report` |
| fileKey | String? | resource only; name of the stored PDF (never a public URL) |
| gated | Boolean | resource only; default true |
| createdAt, updatedAt | DateTime | |

Fields that don't belong to an item's kind are stored as null (normalised
server-side, as in the lead engine).

## Backend

### Public API (`/api/content`)
- `GET /api/content?kind=<kind>&page=<n>&resourceType=<t>&when=upcoming|past`
  → `{ items, total, page, pageSize: 9 }`. Published only. News/resources
  ordered by `publishedAt` desc. Events: `when=upcoming` (default) →
  `endsAt ?? startsAt` ≥ now ordered by `startsAt` asc; `when=past` → the
  rest ordered by `startsAt` desc. Items never expose `fileKey`; resources
  expose `hasFile`.
- `GET /api/content/:kind/:slug` → `{ item }` or 404 (unpublished = 404).
- `GET /api/content/resource/:slug/download?token=<t>` → streams the PDF
  (`Content-Type: application/pdf`, `Content-Disposition: attachment;
  filename="<slug>.pdf"`). Ungated resources need no token. Gated resources
  need a valid token for that resource; otherwise 403 `{ message: "This
  download link has expired. Please request the resource again." }`.

### Download tokens
HS256 JWT signed with `DOWNLOAD_TOKEN_SECRET` (falls back to `JWT_SECRET`),
payload `{ purpose: "resource-download", contentId }`, expiry 15 minutes.
Verification checks purpose, contentId matches the requested resource, and
the resource is still published.

### Admin API (`/api/admin/content`, requireAdmin)
- `GET /?kind=` list (all, incl. unpublished), `GET /:id`, `POST /`,
  `PUT /:id`, `DELETE /:id` (also deletes the stored PDF).
- Validation per kind (required: title, slug, summary; event: startsAt,
  format; resource: resourceType; resource published ⇒ fileKey set).
  Duplicate slug within kind → 400 "An item with this slug already exists.".
- `POST /api/admin/upload/resource` — multipart `file`, PDF only (mimetype
  `application/pdf` AND first bytes `%PDF-`), ≤ 20 MB, stored in
  `backend/private/resources/` (gitignored, never served statically) →
  `{ fileKey }`.

### Lead types (extend `leadTypes.js`)
| type | fields/required | department |
|---|---|---|
| `webinar` | name, email, phone, company (all required) + contentId | `Webinars` |
| `resource` | name, email, phone, company (all required) + contentId | `Whitepapers` |

- `contentId` must reference a published item of the right kind; `webinar`
  also requires the event not to have started (400 "Registration for this
  event has closed."); `resource` requires a gated resource with a file.
- `ContactSubmission`/`ContactVerification` gain `contentId Int?` and
  `contentTitle String?` (title snapshot at submit time).
- When a `resource` lead completes (`/start` with verification off, or
  `/verify`), the response is `{ done: true, downloadUrl }` where
  `downloadUrl` is `/api/content/resource/<slug>/download?token=<t>`.
- Admin Messages gains tabs Webinar and Resource; the detail modal and CSV
  show "For: <contentTitle>".

## Site

- Pages (inner-page layout like `/contact`):
  - `/news` (paginated cards) and `/news/[slug]` (cover, date, body,
    "Read original" when sourceUrl).
  - `/events` with Upcoming / Past tabs; `/events/[slug]` shows date & time
    in IST, format, venue; upcoming → registration form (lead type
    `webinar`); past → recording link if set, else "This event has ended.".
  - `/resources` with type filter chips (All · Whitepapers · Guides ·
    Checklists · Reports); `/resources/[slug]` shows summary/body;
    gated → download form (lead type `resource`); ungated → Download
    button.
- Cards reuse the blog card styling. Empty listings show a friendly empty
  state. Pagination via `?page=`.
- Per-page `generateMetadata` (title, summary as description, cover as
  OG image).
- After a resource lead completes, the download starts automatically and
  `/thank-you?type=resource` shows a "Download again" button while the link
  is valid (URL handed over via sessionStorage, never in the page URL).
- Site proxies: `/api/content/...` routes forward to the backend (the
  download route streams the file through).
- Webinar/resource thank-you copy:
  - webinar: "You're registered. We'll email you the joining details before the event."
  - resource: "Thank you. Your download should start automatically."

## Admin

- New **Content** section in the sidebar: tabs News · Events · Resources,
  list (title, status, date), create/edit form with shared fields (title,
  slug auto-filled from title, summary, rich-text body via the existing
  editor, cover image upload, published toggle, publish date) and
  kind-specific fields; resource form has PDF upload with current file
  name and a "Gated" toggle (default on). The "Draft with AI" panel is
  available for news (type `news`) using the existing AI endpoint pattern.
- Delete with confirmation.

## Error handling

| Situation | Result |
|---|---|
| Unknown kind in any API | 400 "Unknown content type." |
| Unpublished or missing item on the public API | 404 |
| Expired / tampered / wrong-resource token | 403 with the expired-link message |
| Stored PDF missing on disk | 404 "This file is no longer available." (logged) |
| Upload not a real PDF / too large | 400 with a clear message |
| Registration after event start | 400 "Registration for this event has closed." |

## Testing

Backend (`node:test` + supertest): content validation per kind; public list
filters (kind, resourceType, upcoming/past boundaries, pagination,
published-only, no fileKey leak); admin CRUD + auth + duplicate slug; PDF
upload (real PDF ok, renamed PNG rejected, size cap); download token (valid,
expired, tampered, other resource, ungated without token); webinar/resource
lead types (validation, closed registration, department, downloadUrl on
completion, contentTitle stored).

Site/admin: `next build`; smoke test of every new page against a separately
started backend (not the user's :5000/:4000).
