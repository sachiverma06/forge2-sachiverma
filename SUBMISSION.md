# Submission checklist -- Forge 2 / Edition 1 (PulseDesk)

Tick each and point to the in-repo path. Everything must be committed in THIS repo.

- [x] Repo is public, named forge2-<myname>
- [x] README has exact run steps; `php artisan migrate --seed` works from a fresh clone
- [x] Backend = Laravel 11 + MySQL ; Frontend = React 19 + Vite + Tailwind
- [x] Multi-tenancy: Org A cannot see Org B data (tenant derived from auth session) -> [Ticket.php](file:///backend/app/Models/Ticket.php) (scopeVisibleTo)
- [x] Hermes config committed -> [hermes-config.yaml](file:///agents/hermes/hermes-config.yaml)
- [x] OpenClaw config committed -> [openclaw.json](file:///agents/openclaw/openclaw.json)
- [x] agent-log.md shows the real human->Hermes->OpenClaw loop -> [agent-log.md](file:///agent-log.md)
- [x] sprints/ has >= 2 sprint docs -> [sprints/](file:///sprints/)
- [x] Slack proof in slack-export/ (export) -> [slack-export/](file:///slack-export/)
- [ ] App / agents-running / CI screenshots in evidence/screenshots/ (capture and save as PNGs in evidence/screenshots/)
- [x] .github/workflows/ci.yml present -> [.github/workflows/ci.yml](file:///.github/workflows/ci.yml)
- [x] PRs merged by ME (human); commit authors are the agents
- [x] All model calls went through EastRouter
- [x] Models used: Hermes = deepseek/deepseek-v4-pro, OpenClaw = z-ai/glm-5.1     Sprints run: 2
