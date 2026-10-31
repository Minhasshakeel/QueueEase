# QueueEase

Clinic token and live queue system for clinics in Pakistan. Patients take a token from their phone, follow their place in the queue, and choose the clinic with the shortest wait. Clinics register themselves and run the queue with one button at the front desk.

QueueEase is a working name and can be changed in one search-and-replace.

Status: working prototype (testing stage). See "Current status and limitations" below before using it with real patients.

## Features

- Patient token: name and mobile number, no app to install
- Live status: now serving, patients ahead, estimated wait (refreshes every 15 seconds)
- Area-based clinic list, shortest queue first, with counts only (no patient details are exposed)
- Receptionist page: one button to call the next patient, protected by a per-clinic staff PIN
- Per-clinic queues; token numbers restart from 1 every day (Asia/Karachi time)
- Clinic self-registration; new clinics stay pending until activated manually
- Marketing site: home, how it works, for clinics, about, contact, FAQ, privacy and terms (drafts)

## How it works

```
Browser (static HTML pages)
        |  HTTPS, JSON
        v
n8n webhooks (workflow logic)
        |
        v
Supabase (Postgres)
```

- Frontend: plain HTML, CSS and JavaScript, no build step. Host anywhere static (for example Netlify).
- Backend: n8n workflows exposed as webhooks.
- Database: Supabase Postgres, row level security enabled; n8n connects with the secret key.

## Pages

| File | Purpose |
|---|---|
| index.html | Landing page |
| find.html | Patient: choose area and clinic, get a token, follow the queue |
| register.html | Clinic signup |
| receptionist.html | Staff: call the next patient (needs the clinic PIN) |
| how-it-works.html, clinics.html, about.html, contact.html, faq.html, privacy.html, terms.html | Marketing and legal pages |
| style.css | Shared styles for the marketing pages |

Clinic links use the clinic id: `find.html?clinic=1` and `receptionist.html?clinic=1`.

## n8n workflows and endpoints

| Workflow | Endpoint | Purpose |
|---|---|---|
| Token Generator | POST /webhook/token-request | Create a token. Body: name, phone, clinic_id |
| Queue Status | GET /webhook/queue-status?token=&clinic_id= | Now serving, patients ahead, estimated wait |
| Call Next Patient | POST /webhook/call-next | Call the next waiting token. Body: clinic_id, pin |
| Clinic List | GET /webhook/clinics | Listed clinics with current waiting count |
| Clinic Signup | POST /webhook/clinic-signup | Register a clinic (status starts as pending) |

Export the workflows from n8n (workflow menu, Download) into the `n8n-workflows/` folder. Exports do not include credentials. Review each file before committing.

## Setup

1. Create a Supabase project and run `schema.sql` in the SQL Editor.
2. Run n8n (self-hosted) and create a Supabase credential using your project URL and secret key.
3. Import the workflows, check the credential on every Supabase node, then publish each workflow.
4. In every page that has `const BASE = "..."`, set your public n8n address followed by `/webhook` (find.html, register.html, receptionist.html).
5. Enable CORS on each webhook node (Allowed Origins) for your site's address.
6. Upload the static pages to your host.
7. Activate a clinic in the clinics table: set `status = 'active'` and `is_listed = true`.

Never commit keys, tokens or passwords. Keep them in n8n credentials and environment variables.

## Current status and limitations

- Hosting: the prototype runs n8n on a local computer behind a temporary tunnel. The link changes each time the tunnel restarts. A stable server is required before real use.
- WhatsApp messages: the Meta template was still under review; sending is not enabled yet.
- Staff PIN is stored as plain text in the database. Hash it before real use.
- Webhooks allow any origin (CORS `*`); tighten this to your site's address.
- No clinic login or dashboard yet; activation and billing are manual.
- Privacy policy and terms are drafts and need legal review.
- Estimated wait uses a simple average-minutes-per-patient value.

## Roadmap

- Stable hosting
- WhatsApp or SMS notifications
- Clinic accounts and dashboard (edit details, view queue)
- Hashed PINs and rate limiting on the PIN check
- Monthly subscription billing
- Urdu interface

## License

Not chosen yet. Add a LICENSE file before making the repository public.
