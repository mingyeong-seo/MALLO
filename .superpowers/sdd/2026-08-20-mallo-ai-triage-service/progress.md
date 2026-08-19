# SDD ledger — plan: docs/superpowers/plans/2026-08-20-mallo-ai-triage-service.md

## Setup

- Base implementation branch: `feat/ai-triage-service`
- Branch start: `729c417` design commit; plan commit `af0647b`
- Workspace: dedicated clone `mallo-audit`; normal `.git` checkout, isolated from team working copies
- Ruling: work in this dedicated clone instead of creating a nested linked worktree — the clone was created solely for this task and already protects other working copies — cost if wrong: cleanup is manual rather than `git worktree remove`.
- Ruling: default model changed from `openai/gpt-5.6-luna` to `google/gemini-3.7-flash` — live requests proved Luna unavailable under the required ZDR policy while Gemini returned valid strict JSON — cost if wrong: model-quality regressions require rerunning the live evaluation and changing one environment value.
- Ruling superseding the prior model ruling: user prioritized full model availability over mandatory ZDR; a direct Luna request with `data_collection="deny"` and no ZDR returned correct strict JSON with zero reasoning tokens, so the default returns to `openai/gpt-5.6-luna` — cost if wrong: an upstream provider may temporarily retain prompts for security or abuse prevention even though collection/training providers remain excluded.
- Ruling: project/config scaffolding may precede the first RED test, but no behavioral production implementation may — TDD exceptions cover configuration files only — cost if wrong: configuration could encode a bad dependency choice before a behavioral test catches it.
- Ruling: Kiro review is optional and non-blocking — deterministic tests remain the acceptance gate — cost if wrong: one additional external review signal may be unavailable.
- Ruling: evaluator-branch `main` ancestry is a separate submission gate, not a feature-branch completion gate — this plan never merges or pushes shared branches without explicit authority — cost if wrong: the feature can be complete but not yet submission-ready.
- Ruling: Pydantic AI 2.32 native output wraps the root `ProviderDecision` union, so Task 3 uses an explicit strict `ProviderDecisionOutput(result=...)` envelope and returns its typed `result` — cost if wrong: live output would be rejected for a missing implicit `result` field despite valid decision JSON.

## Preflight consistency table

| Producer task | Consumer task | Shared file/interface | Finding | Ruling |
|---|---|---|---|---|
| 1 | 2 | `TriageInput`, `ProviderDecision`, `TriageResponse`, vocabulary | Names and variants agree | none |
| 1-2 | 3 | `TriageProvider`, typed provider output | Provider is classification-only | none |
| 2-3 | 4 | `TriageService`, settings, provider lifecycle | App factory injects provider for tests | none |
| 4 | 5 | `mallo_ai.main:app`, `/healthz` | Container consumes real ASGI surface | none |
| 1 | 6 | JSON contract `1.0`, enums and snake_case | Java DTO must reject unknown fields | dedicated strict mapper mandated |
| 6 | 7 | `AiTriagePort`, `AiTriageResult` | AskService preserves public DTO | none |
| 4, 7 | 8 | real AI HTTP service and Spring `/v1/ask` | E2E requires both processes | none |
| 8 | 9 | final tested SHA and deployment state | Submission data must be factual | no invented track/team/account values |
| 5 | 8 | `ai-service/README.md` | Task 8 amends Task 5 documentation | include both changes in later commit only |
| docs commit | 8 | design and plan docs | Task 8 plan listed them for commit although already tracked | stage only if live evidence changes them |

| Task | Internal self-consistency check | Result |
|---|---|---|
| 1 | Contract tests precede contract implementation; strict union files listed | pass |
| 2 | Safety tests prove provider bypass before safety implementation | pass |
| 3 | Settings and privacy configuration have deterministic tests; live model deferred to Task 8 | pass |
| 4 | Auth/error tests precede API implementation; real HTTP surface specified | pass |
| 5 | Real Docker build/run is the config acceptance surface | pass |
| 6 | MockRestServiceServer tests precede Java adapter | pass |
| 7 | AskService tests precede keyword-parser replacement | pass |
| 8 | Deterministic gates precede one bounded paid live smoke | pass |
| 9 | Main/deployment alignment is reported without automatic merge/push | pass |

## Task status

- Baseline: `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home GRADLE_USER_HOME=/private/tmp/mallo-gradle ./gradlew test` PASS at `be4ebde` (24s).
- Task 1: dispatched `/root/impl_task_1` at base `be4ebde`; brief `task-1-brief.md`; report `task-1-report.md`.
- Task 1: implementation complete at `622cb72`; RED 3 expected contract failures; GREEN pytest 3/3, Ruff lint/format, basedpyright clean; review pending.
- Task 1: fix round 1/5 at `822c4b2` (duplicate trailing expression removed; module reduced to 250 lines; pytest 3/3, Ruff, basedpyright clean; scoped re-review pending).
- Task 1: complete (commits `be4ebde..822c4b2`, fix round 1 addressed 2 findings, review clean).
- Task 2: dispatched `/root/impl_task_2` at base `822c4b2`; brief `task-2-brief.md`; report `task-2-report.md`.
- Task 2: implementation complete at `9737e96`; RED captured; GREEN focused 9/9, full 12/12, Ruff, basedpyright, rule audit clean; review pending.
- Task 2: fix round 1/5 at `d6e7bde243cda1c61472c8cd8fa7b37f6078201a` (Korean particles/punctuation prompt-injection bypass fixed; typed response construction replaces raw dumped-dict mutation; category/precedence tests added).
- Task 2: complete at `d6e7bde243cda1c61472c8cd8fa7b37f6078201a`; re-review lane `/root/rereview_task_2_fix_1` APPROVED with 0 findings; focused pytest 20/20, full pytest 23/23, Ruff lint/format, basedpyright 0 errors/warnings.
- Task 3: dispatched `/root/impl_task_3` at base `cd85272`; brief `task-3-brief.md`; report `task-3-report.md`.
- Task 3: implementation complete at `d81e6e76b41378c52b1574095c39bcec47a74b44`; RED missing settings module; GREEN focused 5/5, full 28/28, Ruff lint/format, basedpyright 0 errors/warnings; review pending.
- Task 3: complete at `d81e6e76b41378c52b1574095c39bcec47a74b44`; review lane `/root/review_task_3` APPROVED with 0 findings; focused pytest 5/5, full pytest 28/28, Ruff lint/format, basedpyright 0 errors/warnings, diff and tracked-secret scans clean.
- Task 4: dispatched `/root/impl_task_4` at base `d81e6e76b41378c52b1574095c39bcec47a74b44`; brief `task-4-brief.md`; report `task-4-report.md`.
- Task 4: implementation complete at `1ae694f73e5a73b20ff2b9d513644ef72ba5a88c`; RED missing app module; GREEN focused 12/12, full 40/40, Ruff lint/format, basedpyright 0 errors/warnings; real local uvicorn E2E with fake provider passed; review pending.
- Task 4: fix round 1/5 at `925a0cdc53b93b8a54f00ce494418ac92c280fe9` (stable 502 for invalid model response; all Task 4 cast/ignore suppressions removed; typed settings loader and test support added). Re-review found one medium fixed-port collision risk; fix round 2 dispatched.
- Task 4: fix round 2/5 at `1d8448dfcd84db394f1c678e6363c3e1f568b36a` (OS-assigned port and explicit type narrowing). Re-review found the socket-close-before-uvicorn-bind TOCTOU race; fix round 3 dispatched.
- Task 4: fix round 3/5 at `4cfd19a109e8c470ffe92c1e2ff8f70e5b0e3e65` (bound/listening socket passed directly to uvicorn and deterministically closed).
- Task 4: complete at `4cfd19a109e8c470ffe92c1e2ff8f70e5b0e3e65`; re-review lane `/root/rereview_task_4_fix_3` APPROVED; e2e 1/1, full pytest 43/43, Ruff, basedpyright 0 errors/warnings, diff check clean.
- Task 5: dispatched `/root/impl_task_5` at base `43ff8a6`; brief `task-5-brief.md`; report `task-5-report.md`.
- Task 5: implementation complete across `99cfb1b..74e567e5a05f2898b78f74f07a7291e901a9b01e`; RED missing Dockerfile; GREEN Python 43/43 with 93% branch coverage, Ruff, basedpyright, no-excuse and secret scans; Docker image built, healthy, non-root `mallo`, `/healthz` observed, QA container removed; review pending.
- Task 5: complete at `74e567e5a05f2898b78f74f07a7291e901a9b01e`; review lane `/root/review_task_5` APPROVED; independent Docker build/context/runtime/health/user/history and full Python gates passed. One non-blocking README placeholder wording cleanup deferred to the submission documentation pass.
- Task 6: dispatched `/root/impl_task_6` at base `74e567e5a05f2898b78f74f07a7291e901a9b01e`; brief `task-6-brief.md`; report `task-6-report.md`.
- Task 6: implementation complete at `f3438a28e34efd60b9257a1e6c32a2123a8afb8a`; RED missing adapter classes; GREEN focused adapter tests and full backend 150 tests, diff/secret scan clean; review pending.
- Task 6: review found two high issues: unclosed RestClient response via `exchange(..., false)` and insufficient action-specific union validation. Fix round 1/5 dispatched to `/root/impl_task_6`.
- Task 6: fix round 1/5 at `2c721d57ca413ab690c362ba093c62445c90f95e` (default auto-closing exchange; exact action/context/missing/safety union validation with regressions).
- Task 6: complete at `2c721d57ca413ab690c362ba093c62445c90f95e`; re-review lane `/root/rereview_task_6_fix_1` APPROVED; focused adapter and full backend suites, diff and secret scans passed.
- Task 7: dispatched `/root/impl_task_7` at base `2c721d57ca413ab690c362ba093c62445c90f95e`; brief `task-7-brief.md`; report `task-7-report.md`.
- Task 7: implementation complete at `9714acedf7130e4f485552fc3cd5c282bf8d6b14`; RED constructor mismatch; GREEN focused Ask service/controller and full backend suites, old-parser and secret scans clean; review pending.
- Task 7: review found medication/treatment precheck regression, invalid stringly port results escaping as generic 500, and external AI call inside a DB transaction. Fix round 1/5 dispatched to `/root/impl_task_7`.
- Task 7: fix round 1/5 at `5272174d171351a32f72f016b86bc448b0720375` (targeted medication/diagnosis precheck without `약산성`/`병풀` false positives; invalid AI results map 502; AI call outside DB transaction).
- Task 7: complete at `5272174d171351a32f72f016b86bc448b0720375`; re-review lane `/root/rereview_task_7_fix_1` APPROVED; focused Ask and full backend suites, parser/transaction/secret scans passed.
- Task 8: complete at `d19de189f458bfcf337b72571fe5a47ae903504d`; RED live Luna smoke caught high-intensity exercise as missing context; provider vocabulary instruction fixed; GREEN live smoke 1/1 with 2 model calls and 1 deterministic safety bypass; AI full suite 43/43 plus 1 live deselected, 93% branch coverage; backend build successful; local cross-service QA observed session creation, `MATCHED/EXERCISE/POSTPONE` with protocol fields, and `CONNECT` without protocol fields.
- Task 9: submission readiness document added; factual only, with unknown track/team/assets/deployed URL left as confirmation items and explicit warning that verified AI work is not yet merged to evaluator branch `main`/`master`.
- Task 8: review lane `/root/review_task_8` APPROVED at `d19de189f458bfcf337b72571fe5a47ae903504d`; deterministic/static/backend gates and live-test isolation passed without repeating paid inference.
- Task 8 manual follow-up: root independently reproduced cross-service session, action, and safety paths. Initial local Uvicorn command failed for the uninstalled `src/` layout; `af7f922` records the verified `--app-dir src` command after a healthy toggle and process cleanup.
- Task 9: verifier found one unsupported hospital-review claim in a pre-existing entity comment; `3ed4d57` neutralized the wording. Scoped re-review pending.
