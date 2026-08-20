# Task 8 Report: Live OpenRouter Smoke and Cross-Service Manual QA

## Scope

- Added an explicitly excluded `live` pytest marker.
- Added a bounded OpenRouter live smoke for MALLO AI triage.
- Corrected README secret placeholder wording so it is not copyable as a real value.
- Tightened provider classification instructions after live evidence showed an exercise-intensity miss.

## RED

- `uv run pytest -m live tests/live/test_openrouter_live.py -q`
  - Result: failed.
  - Root cause: the model returned `ACTION/MISSING_CONTEXT/EXERCISE` for the complete high-intensity exercise case.
  - No raw prompt, raw response body, credential, or token text was recorded.

## GREEN

- `UV_CACHE_DIR=/private/tmp/mallo-uv uv run ruff format --check src tests`
  - Result: 24 files already formatted.
- `UV_CACHE_DIR=/private/tmp/mallo-uv uv run ruff check src tests`
  - Result: all checks passed.
- `UV_CACHE_DIR=/private/tmp/mallo-uv uv run basedpyright`
  - Result: 0 errors, 0 warnings, 0 notes.
- `UV_CACHE_DIR=/private/tmp/mallo-uv uv run pytest -m 'not live' --cov=mallo_ai --cov-branch`
  - Result: 43 passed, 1 deselected, 93% branch coverage.
- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home GRADLE_USER_HOME=/private/tmp/mallo-gradle ./gradlew test`
  - Result: build successful.
- `UV_CACHE_DIR=/private/tmp/mallo-uv uv run pytest -m live tests/live/test_openrouter_live.py -q`
  - Result: 1 passed.

## Live Evidence

- Live provider model calls: 2.
- Deterministic safety bypassed provider calls: 1.
- Observed AI triage outcomes:
  - complete action: `ACTION/COMPLETE/EXERCISE/INTENSE_ACTIVITY`
  - missing context: `ACTION/MISSING_CONTEXT/EXERCISE/ASK_EXERCISE_INTENSITY`
  - safety: `CONNECT/SYMPTOM_JUDGMENT`

## Cross-Service Manual QA

- AI service: `127.0.0.1:18000`, `/healthz` returned ok.
- Spring backend: `127.0.0.1:18180`, H2 memory DB, default profile with ProtocolSeeder enabled.
- Session creation: success.
- ASK action path: `MATCHED/EXERCISE/POSTPONE`, with guidance, next action, and protocol reference present.
- ASK safety path: `CONNECT`, with action, decision, guidance, next action, and protocol reference absent; message present.
- Process logs observed during QA did not print raw questions or credentials.

## Secret Audit

- `git check-ignore -v ai-service/.env.local`
  - Result: ignored by `.gitignore:34`.
- Current tracked grep for leading `OPENROUTER_API_KEY=` or `AI_SHARED_SECRET=` assignments:
  - Result after README cleanup: no current tracked matches expected.
- Historical `git log -G` still reports prior README placeholder commit `74e567e`; this is a non-secret placeholder, not a credential value.

## Notes

- `uv` commands require `UV_CACHE_DIR=/private/tmp/mallo-uv` in this sandbox to avoid reading the user home cache.
- Local HTTP and Gradle tests require elevated local socket permission in this sandbox.
- A stale SSH listener occupied `127.0.0.1:18080`; cross-service QA used `18180`.
- Independent manual QA found the original local Uvicorn command could not import
  the uninstalled `src/` layout. Adding `--app-dir src` changed startup from
  `ModuleNotFoundError` to a healthy `/healthz` response; README and plan now use
  the verified command.
