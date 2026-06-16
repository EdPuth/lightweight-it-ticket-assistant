# Claude Code — Plan Mode Prompt

> 复制下面这段给 Claude Code，建议先用 plan mode。

```text
You are the main frontend design and implementation agent for my practice project.
Project: Lightweight IT Support Ticket Assistant.
Goal: Build a beginner-friendly MVP web app for internal IT support ticket management.

Important workflow rules:
1. Start in plan mode. Do not modify files until the plan is clear.
2. Read and create project documents first.
3. Keep the MVP small and avoid over-engineering.
4. You are responsible for frontend design and implementation.
5. Codex will be responsible for code review and project management, so your work must be easy to review.

Please create a detailed implementation plan with phases:
- Phase 0: Project setup and docs
- Phase 1: Mock data and data model
- Phase 2: Dashboard and ticket list
- Phase 3: Ticket detail page
- Phase 4: Create ticket page
- Phase 5: AI suggested reply mock feature
- Phase 6: Polish, accessibility, README

For each phase, include:
- goal
- files to create or modify
- implementation steps
- acceptance criteria
- risks
- what Codex should review after the phase

Do not start coding until I approve the plan.
```
