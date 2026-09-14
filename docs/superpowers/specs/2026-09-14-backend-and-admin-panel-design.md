# Backend + Admin Panel — Design Spec

Date: 2026-09-14
Status: Approved by user, ready for implementation planning

## Purpose

Today the Bexon site has two "dynamic-ish" features that were built in an
earlier session:

- Blogs, sourced from a static `public/fakedata/blogs.json` file, exposed
  read-only through `src/app/api/blogs` and `src/app/api/blogs/[slug]`.
- A contact form that POSTs to `src/app/api/contact`, which sends an email
  via Nodemailer and nothing else (no persistence, no UI to view messages).

The user wants to actually manage this content: create/edit/delete blog
posts and read contact submissions through a UI, without touching code or
redeploying the live site for every change. They also want the live site
and the management UI ("Admin Panel") to be deployable to two different
domains, and a local backend they can run and test against before wiring
up real SMTP credentials.

The user is a React developer, not a backend/infra specialist, and asked
for the architecture to be designed rather than dictated.

## Scope

In scope: Blogs (CRUD via Admin, read via live site) and Contact
submissions (create via live site, read via Admin). Explicitly out of
scope for this round: Services, Portfolio, Team, Careers, Products —
those stay exactly as they are today (static JSON, no admin UI).

SMTP/email setup is deferred until after the rest of this works — the
contact flow must fully work (submissions saved, visible in Admin)
without any SMTP configuration.

## Architecture

Three independent pieces, each deployable to its own domain, living as
three top-level folders in this one repo (a repo split is a non-code
change later if ever wanted):

```
bexon/
├── src/, public/, ...        # existing live site — UNCHANGED location
├── backend/                  # NEW — standalone API + database
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js           # creates admin user + imports blogs.json once
│   ├── src/
│   │   ├── routes/           # blogs.js, contact.js, admin-auth.js, admin-blogs.js, admin-messages.js
│   │   ├── middleware/       # requireAdmin.js (verifies JWT cookie)
│   │   ├── lib/               # prisma client, mailer (best-effort email)
│   │   └── server.js
│   ├── data/dev.db           # SQLite file, gitignored
│   ├── .env.example
│   └── package.json
└── admin/                    # NEW — separate Next.js app
    ├── src/app/
    │   ├── login/
    │   ├── blogs/             # list, create, edit
    │   └── messages/           # list contact submissions, mark read
    ├── .env.example
    └── package.json
```

Locally: live site on `:4000` (unchanged), backend on `:5000`, admin on
`:3001`. In production, each gets its own domain; the backend's URL is
passed to the other two via env var.

## Data model (Prisma / SQLite)

```prisma
model Blog {
  id          Int      @id @default(autoincrement())
  slug        String   @unique
  title       String
  excerpt     String?
  content     String?
  img         String?
  category    String?
  tags        String?          // JSON-encoded array of strings
  author      String?
  authorRole  String?
  status      String?          // badge text, e.g. "Tutorial"
  published   Boolean  @default(true)
  publishedAt DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model ContactSubmission {
  id        Int      @id @default(autoincrement())
  name      String
  email     String
  phone     String?
  service   String?
  message   String
  status    String   @default("new")   // "new" | "read"
  createdAt DateTime @default(now())
}

model Admin {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
}
```

This is deliberately simpler than the original `blogs.json` shape (no
`img1`–`img6`, no `blogTopList`, no nested `comments` — those were
template placeholder variations for different card layouts, not real
editable content). A backend-side adapter maps `Blog` rows back into the
exact field names the existing ~13 blog components already destructure
(`id`, `slug`, `title`, `desc`, `img`, `date`, `day`, `month`, `category`,
`tags`, `author`, `author_role`, `status`, ...) — computed from
`publishedAt` — so none of that component code changes again.

**Bug fix included in this work**: `BlogDetailsPrimary.js`'s post body is
currently hardcoded lorem-ipsum text for every post — it never reads
`currentItem.desc`. Without fixing this, Admin-authored content would
never actually appear on the live site. This gets wired to render the
real `content`/`excerpt`.

## API endpoints (backend)

Public (no auth):
- `GET /api/blogs` — list, same filters as today (`category`, `tag`,
  `author_role`, `search`)
- `GET /api/blogs/:slug`
- `POST /api/contact`

Admin (JWT cookie required, via `requireAdmin` middleware):
- `POST /api/admin/login`, `POST /api/admin/logout`, `GET /api/admin/me`
- `GET /api/admin/blogs` (includes drafts), `POST /api/admin/blogs`
- `PUT /api/admin/blogs/:id`, `DELETE /api/admin/blogs/:id`
- `GET /api/admin/messages`, `PATCH /api/admin/messages/:id` (mark read)

## Auth

Admin logs in with email + bcrypt-checked password. Backend issues a JWT
in an httpOnly cookie (`sameSite=lax` locally; `sameSite=none; secure=true`
in production, since Admin and backend are on different domains there).
`requireAdmin` middleware checks this cookie on every `/api/admin/*`
route. The Admin app calls `GET /api/admin/me` on load and redirects to
`/login` on 401.

A seed script (`backend/prisma/seed.js`) creates exactly one admin
account from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars, only if no admin
exists yet, and imports `public/fakedata/blogs.json` into the `Blog`
table, only if the table is empty — so re-running the seed is a no-op
after the first time.

## Data flow

**Blogs**: the database is the source of truth going forward. The live
site's `getBlogs()` (`src/libs/getBlogs.js`) becomes async and fetches
from the backend. The site's existing `/api/blogs` and `/api/blogs/[slug]`
routes stay in place but become thin server-side proxies to the backend
— so the backend's URL (`BACKEND_URL` env var) never reaches the browser,
and the live site needs no CORS configuration. `BlogMain.js` (currently a
synchronous client-side call to `getBlogs()`) switches to fetching
through the site's own `/api/blogs` route.

**Fallback**: if the backend is unreachable, `getBlogs()` falls back to
reading the local `blogs.json` instead of the site going blank — this is
what makes keeping that file valuable rather than just an inert leftover.

**Contact**: the existing client-side `useContactForm` hook keeps POSTing
to the live site's own `/api/contact` route (same-origin, no CORS), which
now forwards server-side to the backend's `/api/contact`. The backend
always persists the submission first; sending an email is attempted after
and never fails the request — if `SMTP_*` env vars are unset (they will
be, for now) it's logged and skipped.

**Admin app** is the one piece that talks to the backend directly (it's
on a different origin by design), with CORS + credentialed cookies
configured for that specific origin only.

## Error handling

- Backend: a single error-handling middleware returns consistent JSON
  `{ message }` with correct status codes (400 validation, 401
  unauthorized, 404 not found, 500 unexpected).
- Contact submissions never fail due to email problems (see above).
- Live site blog fetches fall back to `blogs.json` on backend failure
  (see above) rather than throwing.

## Testing

- Backend: supertest-based route tests for login success/failure, blog
  CRUD with and without auth, and a contact submission succeeding with no
  SMTP configured.
- Manual end-to-end pass after implementation: run all three apps
  locally, log into Admin, create a post, confirm it renders on the live
  site by slug and in the listing; submit the live site's contact form,
  confirm it appears in Admin → Messages.
- SMTP itself is not tested in this round — deferred until the user
  supplies real credentials.

## Local dev workflow

- `backend/`: `npm install` → `npx prisma migrate dev` → `npm run seed`
  → `npm run dev` (port 5000)
- `admin/`: `npm install`, set `NEXT_PUBLIC_BACKEND_URL=http://localhost:5000`
  in `.env.local` → `npm run dev` (port 3001)
- Live site (`src/`, unchanged): add `BACKEND_URL=http://localhost:5000`
  to `.env.local` → `npm run dev` (port 4000, as today)

All three run side by side in separate terminals during local
development.
