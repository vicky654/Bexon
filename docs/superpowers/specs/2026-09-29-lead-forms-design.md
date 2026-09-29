# Lead Forms on One Engine — Design Spec

Date: 2026-09-29
Status: Design approved in chat, awaiting written-spec review
Parent: website transformation, sub-project A (of A–E). Builds on
`2026-09-28-contact-otp-consent-design.md`.

## Purpose

The transformation brief lists 10+ data collection points. Contact Us is done
(OTP + consent via the consent portal, currently running with OTP off until
the portal API is reachable). This sub-project adds three more lead types —
Book a Consultation/Demo, Partner With Us, Newsletter — on the same engine, so
every lead gets the same verification, consent recording, abuse limits and
admin handling, and the portal receives the right department per lead.

Resource downloads are deferred to sub-project B (they need Resources to
exist); the engine's type config must make adding them a config entry plus a
page.

## Lead types

| type | Page | Required | Optional | Portal department |
|---|---|---|---|---|
| `contact` | `/contact` (existing) | name, email, phone, topic, message | — | `Contact Us` |
| `consultation` | `/book-consultation` | name, email, phone, company, topic | preferredAt, message | `Sales Enquiry` |
| `partner` | `/partner-with-us` | name, email, phone, company, partnershipType, message | — | `Contact Us` |
| `newsletter` | `/subscribe` | name, email, phone | — | `Newsletters` |

- `topic`: the existing 10 purpose values (`CONTACT_TOPICS`).
- `company`: ≤ 150 chars.
- `partnershipType`: one of `reseller` "Reseller / Referral", `technology`
  "Technology Integration", `consulting` "Consulting / Implementation",
  `other` "Other".
- `preferredAt`: ISO datetime; must be between now + 1 day and now + 1 month
  (same window as the old site); stored as a DateTime.
- Existing rules still apply: name ≤ 100, email valid ≤ 254, phone exactly 10
  digits, message ≤ 5000.
- Department names are the ones the old site used, so the portal already has
  consent templates for them. `CONSENT_DEPARTMENT` env override is removed in
  favour of the per-type table (it only ever applied to contact).

## Backend

### `backend/src/lib/leadTypes.js`

Single source of truth:
```js
LEAD_TYPES = {
  contact:      { department: "Contact Us",    required: [...], label: "Contact" },
  consultation: { department: "Sales Enquiry", required: [...], label: "Consultation" },
  partner:      { department: "Contact Us",    required: [...], label: "Partner" },
  newsletter:   { department: "Newsletters",   required: [...], label: "Newsletter" },
}
PARTNERSHIP_TYPES = { reseller: "...", technology: "...", consulting: "...", other: "..." }
validateLead(type, lead, now) → error string | null
```

### Routes (`backend/src/routes/contact.js`)

Same four endpoints, same security (hashed OTP, atomic attempt reservation,
IP / email / global send limits, test-address rule):

- `GET /api/contact/config?type=<type>` — notices for that type's department
  (unknown/missing type → `contact`).
- `POST /api/contact/start` — body gains `type` (missing → `contact`; unknown →
  400 "Unknown form type.") plus `company`, `partnershipType`, `preferredAt`.
  Validated per type. The portal `create_consent` call uses the type's
  department.
- `POST /api/contact/resend`, `POST /api/contact/verify` — unchanged
  contract; they use the department stored with the verification.

### Data model

`ContactSubmission` gains: `type String @default("contact")`,
`company String?`, `partnershipType String?`, `preferredAt DateTime?`.
`ContactVerification` gains the same four (type non-null default "contact").
Migration keeps existing rows (they become `contact`).

`service`/`topic` keep holding the purpose label where the type has a topic;
for partner, `service` holds the partnership label; for newsletter it is
"Newsletter".

### Email

`sendContactNotification` subject becomes `New <Label> lead - <purpose or
partnership>` and the body adds Type, Company, Partnership type and Preferred
time lines when present.

### Admin API

`GET /api/admin/messages?type=<type>` filters by type (no param = all).
`GET /api/admin/messages/export.csv?type=<type>` returns CSV (header row;
columns: Received, Type, Name, Email, Phone, Company, Purpose, Partnership
type, Preferred time, Message, Consent recorded, Language, UTM, Referrer);
values are CSV-escaped and any cell starting with `=`, `+`, `-`, `@` is
prefixed with `'` (spreadsheet formula injection).

## Frontend (site)

- `src/libs/leadForms.js` — per-type field config mirroring the backend
  (fields, labels, placeholders, submit text, thank-you copy), plus the
  partnership options. Topic options stay in `contactTopics.js`.
- `useContactForm(type = "contact")` — sends `type`, loads
  `/api/contact/config?type=…`, keeps the existing OTP state machine; form
  state covers all fields; client-side checks follow the type's required
  list.
- `ContactFormBody` renders fields from the type config (text, email, phone,
  topic select, partnership select, datetime-local, textarea). Contact2 /
  Contact3 keep working with `type="contact"`.
- New pages `/book-consultation`, `/partner-with-us`, `/subscribe`, each using
  the site's inner-page layout (Header, HeroInner, section, Footer) with a
  short intro paragraph (old site copy) beside the form.
- `/subscribe` reads `?email=` and pre-fills it.
- Footer newsletter box (main `Footer.js`): submit navigates to
  `/subscribe?email=<value>`; empty/invalid email shows the browser's
  built-in validation (input type=email, required).
- `/thank-you?type=<type>` shows per-type copy:
  - contact: "Thank you for contacting DPDP Consultants; Our Privacy Expert will reach out to you shortly."
  - consultation: "Thank you for booking a consultation. Our team will confirm your slot shortly."
  - partner: "Thank you for your interest in partnering with DPDP Consultants. Our partnerships team will get in touch."
  - newsletter: "You're subscribed. Welcome to the DPDP Consultants newsletter."
  Unknown/missing type → contact copy. Conversion firing unchanged (once per
  real submission).

## Admin (panel)

- Messages page: filter tabs All · Contact · Consultation · Partner ·
  Newsletter (counts per tab), a Type badge column replacing "Service" with
  "Type" + "Purpose", and an **Export CSV** button that downloads the current
  tab via the export endpoint.
- Detail modal adds Type, Company, Partnership type, Preferred time.

## Error handling

Unchanged from the contact spec, per type. Additionally: invalid
`preferredAt` → 400 "Please choose a time between tomorrow and one month from
now."; unknown `partnershipType` → 400 "Please choose a partnership type.".

## Testing

Backend (`node:test` + supertest):
- `leadTypes` validation per type (required fields, company length,
  partnership values, preferredAt window incl. boundaries, unknown type).
- `/start` per type: correct portal department sent; verification-off save
  stores type + new fields; missing type defaults to contact.
- `/config?type=newsletter` asks the portal for `Newsletters` notices.
- Admin messages filter by type; CSV export content, escaping and formula
  guard; export requires admin auth.
- Existing contact tests keep passing.

Site and admin: `next build`; smoke test through the dev servers with
verification off (each type's `/start` → `{done:true}`, pages return 200).
