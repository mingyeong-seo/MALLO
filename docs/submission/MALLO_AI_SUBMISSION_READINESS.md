# MALLO AI Submission Readiness

Updated: 2026-08-20 KST

## Current Verified Build

- Repository: `https://github.com/mingyeong-seo/MALLO.git`
- Working branch: `feat/ai-triage-service`
- Verified implementation commit: `1c03da5cbaf13605832fb775a30071ba57812c9d`
- Base remote branch used for backend work: `origin/backend-interaction`
- Evaluator branch requirement: `main` or `master`
- Current risk: verified AI work is not yet on `origin/main`; merge/push requires explicit team approval.

## AI Scope Implemented

- Internal FastAPI AI triage service under `ai-service/`.
- OpenRouter default model: `openai/gpt-5.6-luna`.
- Provider settings: strict structured output, `require_parameters=true`, `data_collection=deny`, `allow_fallbacks=true`, reasoning effort disabled/excluded.
- Deterministic safety routing before model calls for symptom judgment, medication/treatment, diagnosis, and prompt-injection style inputs.
- Spring backend adapter calls AI service through `/internal/v1/triage` with `Authorization: Bearer <AI_SHARED_SECRET>`.
- ASK MALLO now routes lifestyle action questions into seeded Recovery Protocol matching and routes medical judgment questions to `CONNECT`.

## Verified Evidence

- AI deterministic suite: `46 passed, 1 deselected`, branch coverage `93%`.
- AI live OpenRouter smoke: `1 passed`; model calls `2`; deterministic safety bypass `1`.
- Backend suite: `./gradlew test` build successful.
- Cross-service local QA:
  - session creation succeeded,
  - action path returned `MATCHED/EXERCISE/POSTPONE` with guidance, next action, and protocol reference,
  - safety path returned `CONNECT` without action, decision, guidance, next action, or protocol reference.
- Secret audit:
  - `ai-service/.env.local` is ignored by `.gitignore`,
  - current tracked files contain no leading `OPENROUTER_API_KEY=` or `AI_SHARED_SECRET=` assignments,
  - historical scan still finds an old README placeholder commit, not a real credential.

## Submission Fields To Fill

- Track: confirm one of `SJF`, `AAC`, `LIKELION`, `Open`.
- Project name: `MALLO` if team agrees.
- One-line intro candidate: `시술 후 고민을, 오늘의 행동으로 연결하는 AI Recovery Companion`
- Team members: fill final real-name participant list.
- Product URL: fill only after deployed FE/BE/AI are all working.
- Test account: optional; avoid login if not required for demo.
- Admin account: optional; leave blank unless an admin page is submitted.
- GitHub FE/BE: `https://github.com/mingyeong-seo/MALLO`
- GitHub AI: use same repo unless the team creates a separate public AI repo.
- Category tags: choose up to five after final submission taxonomy is visible.
- Tech stack:
  - Planning/design: MALLO Recovery Protocol, Figma if used by design team.
  - Frontend: confirm actual frontend stack before submission.
  - Backend: Spring Boot, JPA, MySQL/H2 test, AWS deployment pipeline per team update.
  - AI: FastAPI, Pydantic AI, OpenRouter, GPT-5.6 Luna, structured output.

## Required Final Checks Before Submission

- Merge verified work into the submitted branch, `main` or `master`.
- Keep repository public and ensure deployed product uses the same submitted branch/repo state.
- Deploy AI service to the Gabia server or agreed runtime with:
  - `OPENROUTER_API_KEY`,
  - `AI_SHARED_SECRET`,
  - `MALLO_AI_MODEL=openai/gpt-5.6-luna`.
- Configure Spring backend `AI_BASE_URL` to the deployed AI service and `AI_SHARED_SECRET` to the same 32-character value.
- Lock down Gabia security group before public use; earlier observed defaults were broad for SSH/HTTPS/RDP.
- Produce the required assets:
  - thumbnail images: PNG/JPG/GIF, max 5MB, 1200x800px,
  - IR Deck: PDF, 16:9, max 30MB,
  - demo video: mp4, max 100MB, 2 minutes or less.
- Prepare three service-planning text fields under 1,500 Korean characters each:
  - service introduction and problem definition,
  - core features and solution method,
  - marketability and execution strategy.

## Known Non-Code Gaps

- No push, PR, merge, or production deployment was performed in this local implementation pass.
- Gabia server hardening and AI deployment remain external-production actions.
- The Gabia host is running, but SSH key authentication is not configured and
  browser-terminal access requires the root password. Issuing a new password
  would restart the server, so it was not performed without explicit approval.
- Final track, real participant names, deployed URL, and presentation assets require team confirmation.
