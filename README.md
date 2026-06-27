# PulseDesk -- Forge 2 / Edition 1

A multi-tenant customer support helpdesk SaaS, built using Laravel 11, React 19, Vite, and Tailwind CSS. The app features absolute tenant isolation, role-based dashboards, and SLA policy tracking.

## Stack
Laravel 11 . PHP 8.2 . MySQL 8 . Laravel Sanctum . React 19 . Vite . Tailwind

## EastRouter models I used
- Hermes (planning / product owner): deepseek/deepseek-v4-pro
- OpenClaw (coding): z-ai/glm-5.1

## How to run (EXACT -- a judge will run these from a fresh clone)
### Backend (Laravel + MySQL)
    cd backend
    cp .env.example .env          # set DB_* for your MySQL (default DB_PORT=3307 is pre-configured for local server)
    composer install              # (or run php composer.phar install if composer is local)
    php artisan key:generate
    php artisan migrate --seed
    php artisan serve             # http://127.0.0.1:8000

### Frontend (React + Vite)
    cd frontend
    cp .env.example .env          # set VITE_API_URL=http://127.0.0.1:8000
    npm install
    npm run dev                   # http://127.0.0.1:5173

## Demo logins (from the seeder)
- admin@acme.test / password (Admin role)
- agent1@acme.test / password (Agent role)
- customer1@acme.test / password (Customer role)

## Live URL
runs locally per the steps above

## Where my evidence lives (everything is in THIS repo)
- agents/        -- real Hermes + OpenClaw configs (secrets redacted)
- agent-log.md   -- the human->Hermes->OpenClaw loop
- sprints/       -- one doc per sprint
- slack-export/  -- Slack export or per-channel screenshots
- evidence/screenshots/ -- app, agents-running, CI screenshots
