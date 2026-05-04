# Task Management System Architecture

## Stack

- Next.js App Router for UI and API routes
- File-backed JSON storage today (`data.json`)
- Service-layer modules under `lib/server`
- Role and workflow rules under `lib/shared`
- SMTP email automation through Nodemailer

## Database Structure

The current implementation keeps data in `data.json`, but the schema is designed so it can map directly to SQL tables later.

### `users`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | string / uuid | Primary key |
| `name` | string | Full name |
| `email` | string | Unique |
| `role` | enum | `Admin`, `Developer`, `Tester`, or mapped team role |
| `access_role` | enum | `admin`, `developer`, `tester` |
| `created_at` | datetime | Audit |

### `tasks`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | string / uuid | Primary key |
| `task_key` | string | Human readable ID like `TT-0001` |
| `title` | string | Required |
| `description` | text | Required |
| `priority` | enum | `low`, `med`, `high` |
| `type` | string | Bug, Feature, Testing, etc. |
| `status` | enum | `pending`, `inprogress`, `readyfortesting`, `testing`, `completed`, `reopened`, `closed` |
| `assigned_developer_id` | fk users.id | Required |
| `assigned_tester_id` | fk users.id | Required |
| `current_assignee_id` | fk users.id | Used for inbox and handoff |
| `deadline` | date | Required |
| `created_by_id` | fk users.id | Creator |
| `assigned_by_id` | fk users.id | Last assignment owner |
| `completed_at` | datetime | QA completion timestamp |
| `closed_at` | datetime | Final admin closure timestamp |
| `created_at` | datetime | Audit |
| `updated_at` | datetime | Audit |

### `task_comments`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | string / uuid | Primary key |
| `task_id` | fk tasks.id | Parent task |
| `author_id` | fk users.id | Who wrote it |
| `author_name` | string | Denormalized for history |
| `author_role` | string | Denormalized for history |
| `body` | text | Comment body |
| `created_at` | datetime | Audit |

### `task_activity_logs`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | string / uuid | Primary key |
| `task_id` | fk tasks.id | Parent task |
| `type` | string | `task_created`, `status_changed`, `comment_added`, etc. |
| `actor_id` | fk users.id | Who triggered it |
| `actor_name` | string | Denormalized |
| `actor_role` | string | Denormalized |
| `message` | text | Timeline message |
| `created_at` | datetime | Audit |

## API Endpoints

### Sessions

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `POST /api/member/session`
- `DELETE /api/member/session`
- `GET /api/member/session`

### Users

- `GET /api/members`
- `POST /api/members`
- `PUT /api/members/:id`
- `DELETE /api/members/:id`

### Tasks

- `GET /api/tasks`
  - Filters: `date`, `status`, `priority`, `search`, `memberId`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/comments`

### Dashboard / Reports

- `GET /api/stats`
- `GET /api/reports`

### Automation

- `POST /api/automation/daily`
- `POST /api/automation/evening-summary`
- `POST /api/automation/overdue-alerts`

## Frontend UI Structure

### Login

- Developer / Tester email login screen
- Separate Admin login modal

### Main Dashboard

- Sticky header with active user, admin actions, and email automation buttons
- Left team sidebar for workload inspection
- Summary stat cards for total, pending, in progress, testing, completed, closed, overdue, and not updated
- Filter toolbar for search, status, priority, member, and date
- Kanban board grouped by workflow stage
- Admin reports section with by-member summary and pending queue
- Task detail modal with:
  - Task fields
  - Workflow status changes
  - Comments
  - Activity log

## Workflow Logic

1. Admin creates task and assigns both developer and tester.
2. New task starts in `Pending` and the current assignee is the developer.
3. Developer can move the task to:
   - `In Progress`
   - `Ready for Testing`
4. When a task moves to `Ready for Testing`, ownership shifts to the tester.
5. Tester can move the task to:
   - `Testing In Progress`
   - `Completed`
   - `Reopen`
6. When tester marks `Reopen`, ownership returns to the developer.
7. Only Admin can move a `Completed` task to `Closed`.

## Role Permissions

### Admin

- Full task CRUD
- Can assign developer and tester
- Can close completed tasks
- Can manage users
- Can view full reports
- Can trigger automation emails

### Developer

- Can view their development tasks
- Can move tasks to `In Progress` and `Ready for Testing`
- Can add comments and delay notes
- Cannot close tasks

### Tester

- Can view QA tasks
- Can move tasks to `Testing In Progress`, `Completed`, or `Reopen`
- Can add QA comments
- Cannot close tasks

## Email Automation Setup

### Jobs

- `11:00 AM`: Send assigned, pending, and overdue task list to each user
- `7:00 PM`: Send completed, pending, and not-updated summary to each user
- `Overdue`: Send alert to admin and assigned users for overdue tasks

### SMTP Environment Variables

- `EMAIL_USER`
- `EMAIL_PASS`
- `SENDER_NAME`
- `SENDER_EMAIL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_REJECT_UNAUTHORIZED`

### Scheduler Recommendation

Use a system scheduler in production:

- Windows Task Scheduler
- cron on Linux
- CI/CD scheduled job
- PM2 cron restart hooks if you run an always-on Node process

Suggested schedule:

- `0 11 * * *` -> `POST /api/automation/daily`
- `0 19 * * *` -> `POST /api/automation/evening-summary`
- `0 * * * *` -> `POST /api/automation/overdue-alerts`

## Scalability Path

When you move beyond file storage:

1. Replace `data.json` with PostgreSQL or MySQL.
2. Keep the current API route contracts.
3. Split `lib/server/data-store.js` into repository modules.
4. Add background job processing for email with BullMQ or a queue service.
5. Add RBAC middleware and audit retention policies.
