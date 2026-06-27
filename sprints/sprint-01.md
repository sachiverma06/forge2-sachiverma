# Sprint 01 -- Core Database, Models, Sanctum Auth, and Seeder

Goal: Implement the database migrations, core models with tenancy visibility scope, AuthController endpoints, and a comprehensive database seeder.
Models: Hermes=deepseek/deepseek-v4-pro, OpenClaw=z-ai/glm-5.1

## Issues
- [x] #1 Create migrations for organizations, users, tickets, comments, SLA policies, activity logs, and notifications.
- [x] #2 Create Laravel Eloquent models and define relationships.
- [x] #3 Implement `scopeVisibleTo` in `Ticket` model to filter database queries by the user's organization.
- [x] #4 Implement `register`, `login`, `logout`, and `me` endpoints in `AuthController` using Sanctum.
- [x] #5 Set up `DatabaseSeeder` with organizations, users, SLA policies, tickets, and comments.
- [x] #6 Create feature tests to verify auth, ticket creation, and tenant isolation.

## Outcome
- Shipped: Database schemas, model files, AuthController endpoints, DatabaseSeeder, and TicketApiTest.
- Slipped / moved to next sprint: None.
- PRs: #1 (Core Backend and Database Seeder - merged by user)
