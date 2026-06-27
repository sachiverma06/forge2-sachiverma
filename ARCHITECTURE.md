# Architecture -- PulseDesk

## Multi-tenancy approach
PulseDesk guarantees total database isolation between tenants (Organizations). 
- Every tenant-specific table contains an `organization_id` column.
- The organization (tenant) is never supplied by the client/frontend. It is derived entirely from the authenticated session of the user (`$request->user()->organization_id`) using Laravel Sanctum.
- Queries are restricted at the model level. The `Ticket` model applies a `visibleTo` query scope using the authenticated user's `organization_id` to enforce read/write access.
- Controllers validate that any referenced ticket, comment, or SLA policy belongs to the user's organization prior to any update or delete action (preventing ID harvesting attacks).

## Data model
- **Organization (Tenant)**:
  - Fields: `id`, `name`, `slug`, `created_at`, `updated_at`
- **User (Belongs to Organization)**:
  - Fields: `id`, `organization_id`, `name`, `email`, `password`, `role` (admin, agent, customer)
- **Ticket (Belongs to Organization, Requester, and Assignee)**:
  - Fields: `id`, `organization_id`, `requester_id`, `assignee_id` (nullable), `subject`, `description`, `status` (open, pending, resolved, closed), `priority` (low, medium, high, urgent), `tags` (JSON), `first_response_due_at`, `resolution_due_at`
- **Comment (Belongs to Ticket and User)**:
  - Fields: `id`, `organization_id`, `ticket_id`, `user_id`, `body`, `is_internal` (boolean)
- **SlaPolicy (Belongs to Organization)**:
  - Fields: `id`, `organization_id`, `priority` (low, medium, high, urgent), `response_minutes`, `resolution_minutes`
- **ActivityLog (Belongs to Organization and Ticket)**:
  - Fields: `id`, `organization_id`, `ticket_id`, `user_id` (actor), `event`, `meta` (JSON)
- **Notification (Belongs to Organization and User)**:
  - Fields: `id`, `organization_id`, `user_id`, `ticket_id`, `type`, `message`, `read_at`

## API routes (routes/api.php)

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| POST | /api/register | Guest | Creates organization and registers initial Admin user |
| POST | /api/login | Guest | Verifies credentials and returns Sanctum token |
| POST | /api/logout | Auth | Revokes the current access token |
| GET | /api/me | Auth | Returns authenticated user and organization details |
| GET | /api/tickets | Auth | Returns organization-scoped tickets (filterable) |
| POST | /api/tickets | Auth | Creates a new organization-scoped ticket |
| GET | /api/tickets/{id} | Auth | Returns details for a specific ticket |
| PUT | /api/tickets/{id} | Auth (Admin/Agent) | Updates status, priority, or assignee for a ticket |
| DELETE | /api/tickets/{id} | Auth (Admin only) | Deletes a ticket |
| POST | /api/tickets/{id}/comments | Auth | Creates a comment (internal notes restricted to agents/admins) |
| PUT | /api/tickets/{id}/claim | Auth (Admin/Agent) | Allows an agent or admin to claim a ticket |
| GET | /api/dashboard | Auth | Returns metrics and recent activities for the tenant |

## Key decisions
- **VisibleTo Query Scope**: To prevent data leaks, all ticket fetches must pass through the `visibleTo` scope. If a user tries to access a ticket outside their organization, they receive a 404 response rather than a 403, preventing resource enumeration.
- **SLA Calculation**: Ticket response and resolution deadlines are calculated automatically on creation based on the active SLA policies configured for the organization.
- **Activity and Notification System**: Major updates and status transitions trigger automated activity logging and user notifications within the same tenant boundary.
