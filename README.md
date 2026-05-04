# Team Task Manager

Daily task assignment and tracking board for cluster leads, now organized as a Next.js App Router project.

## What changed

- Migrated the old single `public/index.html` frontend into modular React components.
- Replaced the Express server with Next.js `app/api` route handlers.
- Kept the existing `data.json` storage and reminder email workflow.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Email setup

Copy `.env.example` to `.env` and fill in the SMTP values you already used with the previous version.

Example:

```env
EMAIL_USER=yourname@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
SENDER_NAME=Your Name
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
PORT=3000
```

## App structure

```text
app/
  api/
    members/
    send-reminders/
    stats/
    tasks/
  globals.css
  layout.js
  page.js
components/
  dashboard/
  ui/
lib/
  client/
  server/
data.json
```

## Notes

- `data.json` remains the local source of truth for members and tasks.
- Reminder emails are sent from `app/api/send-reminders/route.js`.
- The dashboard UI is assembled from reusable components under `components/dashboard`.
- Full workflow architecture is documented in [docs/task-management-system.md](./docs/task-management-system.md).
