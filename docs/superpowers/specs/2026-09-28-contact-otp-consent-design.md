# Contact Form OTP + Consent — Design Spec

Date: 2026-09-28
Status: Design approved in chat, awaiting written-spec review

## Purpose

The previous DPDP website (`Desktop/dpdp-WebSite`, PHP) ran every Contact Us
lead through the company's own consent portal: the visitor received an
email OTP, read a DPDP consent notice in their chosen language, agreed, and
only then was the lead saved and emailed to `info@dpdpconsultants.com`. The
new site's contact form skips all of that — it saves and emails whatever is
submitted, with the template's placeholder service list.

The user wants the old flow in the new site, built safely. The old
implementation leaked the correct OTP to the browser (hidden `taken` field)
and the server only checked that *an* OTP was typed, so verification was
bypassable; it also hardcoded every secret in source. Neither is carried over.

## Scope

In scope: the Contact Us form (both `Contact3` on `/contact` and `Contact2`,
which share `useContactForm`).

Out of scope for this round: the old site's other `act` variants (schedule,
newsletter, whitepaper, webinar, event, research), and careers (the new site
already has its own jobs/applications flow). The design keeps a `department`
field so "Schedule a call" can be added later as a small change.

## Decisions

- **The consent portal sends the OTP**, as on the old site. Our backend
  never emails codes itself. This also records the visitor's DPDP consent in
  the portal, which is the product's point.
- **The OTP never reaches the browser.** The backend keeps a hash of the code
  the portal returns and verifies the visitor's entry server-side.
- **All secrets live in `backend/.env`** (gitignored). Until the live portal
  key and a real reCAPTCHA key arrive, `.env` uses the old site's UAT portal
  values and Google's public reCAPTCHA test keys. Swapping is an `.env` edit
  and a backend restart — no code change.
- **Blank portal config = verification off.** If `CONSENT_API_BASE` is unset,
  the form works as today (save + email, no OTP/consent) and the backend logs
  a warning, matching the existing "SMTP not configured, skipping" pattern.

## Visitor flow

1. Form fields: Name, Email, Phone (10 digits, digits only), "Purpose of
   reaching out" (the 10 options below), Message.
2. **Submit** → backend asks the portal to send a code. Form fields lock; the
   page shows "We've sent a 6-digit code to <email>", an OTP input,
   reCAPTCHA, a "Change details" link (unlocks the form, discards the
   pending verification) and a "Resend code" link (enabled after 30s).
3. **Proceed** (enabled once OTP has 6 digits and reCAPTCHA is ticked) →
   opens the consent notice modal: portal-supplied text, language dropdown
   (default English), Agree / Close.
4. **Agree** → backend verifies. On success the browser navigates to
   `/thank-you`. On a wrong code the modal closes and the OTP input shows
   "Invalid OTP" in red; the visitor may retry.

When verification is off (step "Blank portal config" above), Submit saves
directly and navigates to `/thank-you`.

Purpose options (from the old site, value → label):

| value | label |
|---|---|
| compliance_evaluation | Compliance Evaluation & Risk Assessment |
| policy_development | Assist in Policy Development |
| training_education | Training & Education Programs for DPDPA Compliance |
| data_audit_analysis | Comprehensive Data Audit & Analysis |
| incident_response | Incident Response Planning |
| live_demos | Live Demonstrations of Compliance Tools |
| gap_assessment | Gap Assessment Review & Remediation Planning |
| dpo_service | Data Protection Officer as a Service |
| contract_review | Contract Review & Data Processing Agreements |
| consulting_advisory | Consulting, Advisory, and Audit |

## Backend

### `lib/consentPortal.js`

Wraps the portal. Signs an HS256 JWT per request with payload
`{ iss, aud, email, expiry: now + 3600 }` using `CONSENT_JWT_SECRET`
(same shape the old PHP used). Exposes:

- `isConfigured()` — true when `CONSENT_API_BASE` and `CONSENT_JWT_SECRET` are set.
- `getConsentNotices(department)` — `GET {base}/api/v2/get/template_details?department_name=…`;
  returns `{ [language]: { content } }` from `data`. Cached in memory 10 minutes per department.
- `createConsent({ name, email, phone, ipaddress, department, devicetype, language, otp? })` —
  `POST {base}/api/v2/create_consent`, form-encoded, Bearer token. Without
  `otp`, the portal emails a code and returns it as `otp` in the JSON; with
  `otp`, it records consent. Also sends `digi_type: "parent"` as the old code did.
  Throws on network error or non-2xx.

### `lib/recaptcha.js`

`verifyRecaptcha(token, ip)` — POSTs to
`https://www.google.com/recaptcha/api/siteverify` with `RECAPTCHA_SECRET`.
Returns true/false. If `RECAPTCHA_SECRET` is unset, returns true and logs a warning.

### Routes (`routes/contact.js`)

- `GET /api/contact/config` → `{ verification: boolean, recaptchaSiteKey, notices }`.
  `notices` is `{}` when verification is off or the portal fetch fails (the
  modal then shows a generic fallback consent sentence).
- `POST /api/contact/start` — body `{ name, email, phone, topic, message, tracking }`.
  Validates (name, email format, 10-digit phone, topic in the list, message
  required). Calls `createConsent` without OTP; stores a `ContactVerification`
  row with a bcrypt hash of the returned OTP, expiry now+10min, attempts 0.
  Returns `{ verificationId }`. If verification is off, instead saves the
  submission immediately and returns `{ done: true }`.
  Portal failure → 502 "We couldn't send a verification code right now…".
- `POST /api/contact/resend` — body `{ verificationId }`. Rejects if <30s since
  last send. Calls `createConsent` again, replaces the hash, resets expiry and attempts.
- `POST /api/contact/verify` — body `{ verificationId, otp, language, recaptchaToken }`.
  Order: row exists and not expired (else 410 "start again") → attempts < 5
  (else 429 and row deleted) → reCAPTCHA (else 400) → bcrypt compare (on
  mismatch increment attempts, 400 "Invalid OTP") → `createConsent` with OTP
  (failure is logged and the lead is still saved with `consentRecorded=false`)
  → save `ContactSubmission` → send notification email → delete row →
  `{ done: true }`.
- The existing `POST /api/contact` is removed; both forms use the new routes.

Test-address rule from the old site kept: emails containing `yopmail` or
`dpdpconsultants` go through the full flow but are not saved or emailed.

### Data model (Prisma)

New model:

```prisma
model ContactVerification {
  id          String   @id @default(uuid())
  name        String
  email       String
  phone       String
  topic       String
  message     String
  tracking    String   // JSON: utm, referrer, device, ip
  otpHash     String
  attempts    Int      @default(0)
  lastSentAt  DateTime @default(now())
  expiresAt   DateTime
  createdAt   DateTime @default(now())
}
```

`ContactSubmission` gains optional columns: `topic`, `language`, `utm`,
`referrer`, `device`, `ip`, `consentRecorded Boolean @default(false)`. The
existing `service` column stays for old rows; new rows store the purpose
label in both `service` and `topic` so the current admin list keeps working.

Expired `ContactVerification` rows are deleted opportunistically at the start
of each `/start` call.

### Email

`sendContactNotification` additionally includes purpose, language, UTM,
referrer, device, IP and whether consent was recorded.

## Frontend

- `useContactForm` becomes a small state machine: `form → otp → done`, calling
  the proxy routes below. Loads `/api/contact/config` on mount.
- `Contact2` / `Contact3`: real purpose dropdown, digits-only phone input,
  OTP + reCAPTCHA section, "Change details" / "Resend code" links.
- New `ConsentModal` component: language select + notice HTML from the portal
  (rendered with `dangerouslySetInnerHTML`, as the old site echoed it raw —
  the portal is first-party), Agree / Close.
- reCAPTCHA v2 checkbox via Google's `api.js` script, loaded only while the
  OTP step is shown.
- Next.js proxy routes under `src/app/api/contact/` (`config`, `start`,
  `resend`, `verify`) forward to the backend and pass the visitor's IP in
  `X-Forwarded-For`. The backend reads IP from that header, falling back to
  the socket address.
- `TrackingCapture` client component in the root layout: on first page view
  of a session, stores `utm_source/utm_medium/utm_id/utm_campaign` and
  `document.referrer` in sessionStorage (try/catch; absent storage just means
  no tracking). The hook sends them with `/start`. Device type (Mobile /
  Tablet / Desktop) is derived server-side from the User-Agent, as the old
  `device-type.php` did.
- New `/thank-you` page with the old site's contact message and the Google
  Ads conversion event `AW-16540124026/XOSvCLjTsasZEPqG-c49`. The gtag base
  script for `AW-16540124026` is added to the root layout.

## Admin

The message detail modal shows the new fields (purpose, language, UTM,
referrer, device, IP, consent recorded yes/no). No other admin changes.

## Configuration (`backend/.env.example` additions)

```
# Consent portal — sends the contact-form OTP and records consent.
# Leave CONSENT_API_BASE blank to turn verification off.
CONSENT_API_BASE=
CONSENT_JWT_SECRET=
CONSENT_JWT_ISS=
CONSENT_JWT_AUD=
CONSENT_JWT_EMAIL=
CONSENT_DEPARTMENT=Contact Us

# Google reCAPTCHA v2 checkbox. Google's test keys work on localhost only.
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET=
```

## Error handling summary

| Situation | Result |
|---|---|
| Portal down at `/start` | 502, friendly message with info@ address; nothing saved |
| Portal down at `/verify` consent call | Lead saved + emailed, `consentRecorded=false`, error logged |
| Wrong OTP | 400 "Invalid OTP", attempts+1 |
| 5 wrong OTPs | 429, verification deleted, visitor starts again |
| Expired / unknown verificationId | 410, visitor starts again |
| reCAPTCHA fails | 400, OTP attempt not counted |
| Portal notice fetch fails | Modal shows fallback consent sentence |
| SMTP not configured | Email skipped with log line (existing behaviour) |

## Testing

Backend `node:test` + supertest, following `contact.test.js`, with the portal
and Google verify stubbed:

- `/start` stores a hashed OTP and never returns it; validation errors; portal failure → 502.
- `/verify`: correct OTP saves submission and deletes verification; wrong
  OTP increments attempts; 5th failure → 429; expired → 410; reCAPTCHA
  failure; portal consent failure still saves with `consentRecorded=false`.
- `/resend` rate limit.
- Verification off → `/start` saves directly.
- Test-address rule.
- `consentPortal` JWT payload shape and caching.

Then `next build` and a manual run with blank portal config.

**Not testable here:** the real portal. The design assumes `create_consent`
returns the OTP as `otp` in its JSON when called without one — the old PHP
relies on this (`$decodedArray['otp']`). It must be confirmed once against
the UAT portal.
