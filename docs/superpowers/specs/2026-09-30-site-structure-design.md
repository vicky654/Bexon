# Site Structure and Core Pages — Design Spec

Date: 2026-09-30
Status: Sitemap approved in chat; design awaiting written-spec review
Parent: website transformation, sub-project C (of A–E). Blogs, News, Events,
Resources, Careers, Contact, Book a Consultation, Partner With Us, Subscribe
and Thank You already exist (sub-projects A, B and earlier work).

## Purpose

The transformation brief rates website structure, navigation, content,
product presentation and lead generation as High priority: the old site is
"large and somewhat fragmented" with "too many categories/subcategories".
This sub-project gives the new site its real information architecture — a
six-item menu, the DPDP Act / Products / Services / Company pages with
content migrated from the old site — and removes the template's demo pages.

Out of scope: redirects from old `.php` URLs, sitemap.xml, structured data
and the 404 status code (sub-project E); Data Principal Rights portal and
cookie consent integration (sub-project D); the old Gap Assessment quiz and
Vlogs (left out by decision).

## Approved sitemap and URLs

| # | Page | URL | Source (old site) |
|---|---|---|---|
| 1 | Home | `/` | index.php |
| 2 | DPDP Act 2023 (overview) | `/dpdp-act` | what-is-dpdpa.php |
| 3 | DPDP Rules 2025 | `/dpdp-act/dpdp-rules-2025` | draft-dpdp-rules-2025.php |
| 4 | Penalties & Fines | `/dpdp-act/penalties-and-fines` | administrative-fines-and-penalties.php |
| 5 | Third-Party & Processor Obligations | `/dpdp-act/third-party-obligations` | subcontractor-and-thrid-party-issues.php |
| 6 | DPDPA & Business Continuity | `/dpdp-act/business-continuity` | dpdpa-and-business-discontiniuity.php |
| 7 | Compliance Tools (overview) | `/products` | compliance-tools.php |
| 8 | Consent Management | `/products/consent-management` | dpcm.php |
| 9 | Data Principal Rights & Grievance Redressal | `/products/grievance-redressal` | dpgr.php |
| 10 | Data Protection Awareness Program | `/products/awareness-program` | dpap.php |
| 11 | Data Protection Impact Assessment | `/products/impact-assessment` | dpia.php |
| 12 | Third-Party Risk Assessment | `/products/third-party-assessment` | dptpa.php |
| 13 | Cookie Consent Management | `/products/cookie-consent` | cookie-consent-management.php |
| 14 | Services (overview) | `/services` | services.php |
| 15 | Gap Assessment & Readiness Review | `/services/gap-assessment` | readiness-review.php |
| 16 | DPO as a Service | `/services/dpo-as-a-service` | data-protection-officer-as-a-service.php |
| 17 | Contract Review & DPAs | `/services/contract-review` | contract-review-data-processing-agreements.php |
| 18 | Consulting, Advisory & Audit | `/services/consulting-advisory-audit` | consulting-advisory-and-audit.php |
| 19 | Training Programs | `/services/training-programs` | training-programs-for-DPDPA-compliance.php |
| 20 | DPDP Act Foundation Course | `/services/dpdp-act-foundation-course` | dpdp-act-foundation-course.php |
| 21–24 | Blogs, News, Webinars & Events, Resources | existing | — |
| 25 | Case Studies | `/case-studies` | case-study.php |
| 26 | About Us | `/about` | about-us.php (who we are, mission & vision, team, what we do, awards as sections) |
| 27–29 | Careers, Partner With Us, Contact Us | existing | — |
| 30–31 | Book a Consultation, Subscribe | existing | — |
| 32 | FAQs | `/faq` | faq.php |
| 33 | Privacy Notice | `/privacy-notice` | privacyium-privacy-policy.php |
| 34 | Terms & Conditions | `/terms-and-conditions` | terms-and-conditions.php |
| 35–36 | Thank You, 404 | existing | — |

## Navigation

`public/fakedata/nav-items.json` is replaced by `src/content/navigation.js`
(one source for desktop, mobile and footer):

- Home
- DPDP Act ▾ — pages 2–6
- Products ▾ — pages 7–13
- Services ▾ — pages 14–20
- Resources ▾ — Blogs, News, Webinars & Events, Resources, Case Studies
- Company ▾ — About Us, Careers, Partner With Us, Contact Us

Desktop: simple dropdown lists (the template's `sub-menu` styling), active
state for the current section; header CTA button "Book a Consultation"
→ `/book-consultation`. Mobile menu renders the same tree as expandable
groups. The template's demo mega-menus (home demo thumbnails) are removed.
Main footer link columns: Company (About, Careers, Partner, Contact),
Resources (Blogs, News, Webinars & Events, Resources), Legal (FAQs, Privacy
Notice, Terms & Conditions); contact details and socials unchanged.

## Page engine

Content pages are data-driven so all 26 static pages share one tested set of
section components:

- `src/content/pages/<id>.js` exports `{ path, title, description, hero: {
  title, text }, sections: [...] }` where each section is one of:
  - `richText` — `{ heading?, html }` (migrated prose; limited HTML: p, h3,
    ul/ol/li, strong, em, a)
  - `features` — `{ eyebrow?, heading, intro?, items: [{ icon?, title, text,
    href? }] }` (3-column cards)
  - `split` — `{ eyebrow?, heading, html, image, imageAlt, reverse? }`
    (text beside an image)
  - `steps` — `{ heading, items: [{ title, text }] }` (numbered process)
  - `stats` — `{ items: [{ value, label }] }`
  - `faq` — `{ heading, items: [{ question, answer }] }` (accordion)
  - `cta` — `{ heading, text, primary: { label, href }, secondary? }`
  - `cardsLinks` — `{ heading, intro?, items: [{ title, text, href, image? }] }`
    (used by overview pages to link to children)
- `src/components/sections/page/*` — one component per section type, built
  on the template's existing CSS classes (section-gap, sec-heading,
  service/feature card styles, accordion) so pages look native.
- `PageRenderer` maps section types to components; unknown types are
  skipped with a console warning in development.
- Route files are thin: `src/app/dpdp-act/[slug]/page.js` etc. look the
  content up by path, call `notFound()` if missing, and export
  `generateStaticParams` + `generateMetadata` (title, description).
  Overview pages (`/dpdp-act`, `/products`, `/services`) and one-off pages
  (`/about`, `/case-studies`, `/faq`, `/privacy-notice`,
  `/terms-and-conditions`, `/`) use the same renderer.
- A content test (`node --test`) validates every page file: required
  fields, known section types, unique paths, every internal `href` points
  to a known route, images exist under `public/`.

## Content migration

- Copy comes from the old PHP pages (text only; PHP/includes/scripts
  stripped). Light editing only: fix typos ("Discontiniuity", "thrid"),
  consistent product names, headings; no invented facts, figures, clients
  or legal claims. Where the old page is thin, keep it short rather than pad.
- Legal pages (Privacy Notice, Terms) are migrated verbatim apart from
  formatting; the Terms page replaces the template's placeholder terms.
- Images: only images a page actually uses are copied from
  `dpdp-WebSite/assets/images` to `public/images/site/<section>/`, converted
  to WebP and resized to ≤ 1600px wide (target ≤ 300 KB each) with `sharp`.
- Home page is rebuilt from blocks: hero (company positioning), products
  (features → product pages), services (features → service pages), why DPDP
  Consultants, stats (only figures that appear on the old site), latest
  blogs (existing component), CTA.

## Template cleanup

Delete routes: `home-02`…`home-11`, `shop`, `cart`, `checkout`,
`wishlist`, `portfolios`, `pricing-plan`, `our-gallery`, `history`, `team`,
`coming-soon`, `blog-grid`, `blog-list`, `blog-sidebar`, `login`,
`password`, the template's `services/[id]` and `about` pages (replaced),
and `error` (the demo error page; `not-found.js` stays). Components and
fakedata files only used by deleted routes may be deleted when unused
(verified by grep + build); anything still imported stays.

## Testing

- Content validation test (above).
- `next build` for the site (every new route listed, deleted routes gone).
- Smoke on spare ports: every page in the sitemap returns 200; a deleted
  route returns 404 page; header renders the six menus and the CTA.
