## Task 7 Report

Status: implemented and verified.

### RED Evidence

- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home GRADLE_USER_HOME=/private/tmp/mallo-gradle ./gradlew test --tests '*AskServiceTest' --tests '*AskControllerTest'`
- Initial sandbox run failed before Gradle execution with `java.net.SocketException: Operation not permitted`; reran with local Gradle socket permission.
- Result: failed at `compileTestJava` because `AskService` still accepted only `InteractionRepository`, `ProtocolRepository`, and `ObjectMapper`; the new tests required an injected `AiTriagePort`.

### GREEN Evidence

- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home GRADLE_USER_HOME=/private/tmp/mallo-gradle ./gradlew test --tests '*AskServiceTest' --tests '*AskControllerTest'`
- Result: BUILD SUCCESSFUL.
- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home GRADLE_USER_HOME=/private/tmp/mallo-gradle ./gradlew test`
- Result: BUILD SUCCESSFUL.
- `git diff --check`
- Result: no output.
- `rg -n "ACTION_KEYWORDS|RECOVERY_KEYWORDS|extractAction|extractContext|extractOne|Set\\.of\\(\\\"운동\\\"|\\\"헬스\\\"" backend/src/main/java/com/mallo/backend/domain/interaction/service/AskService.java`
- Result: no matches.

### Implemented

- Replaced ASK MALLO local action/recovery keyword parsing with injected `AiTriagePort`.
- Kept backend high-risk medical pre-check before any AI call.
- Kept Spring as the sole owner of Protocol lookup, specific-rule priority, decision, guidance, nextAction, protocolRef, Interaction persistence, and fixed user-facing messages.
- Mapped `ACTION/MISSING_CONTEXT` clarification codes to fixed Korean prompts.
- Mapped `ACTION/COMPLETE` by `ActionType.valueOf` plus AI-provided closed context only.
- Mapped `CONNECT`, `GENERAL`, and `UNSUPPORTED` to fixed backend prose.
- Propagated AI `CustomException` failures without saving an `Interaction`.
- Preserved `photoRecordIds` and public `POST /v1/ask` response shape.
- Removed bare `약` from the Java pre-check to avoid false positives such as `약산성`.

### Test Coverage Added

- No AI call for backend medical pre-check.
- AI input includes question, procedure, and elapsed day.
- Route handling for `ACTION`, `CONNECT`, `GENERAL`, and `UNSUPPORTED`.
- All four missing-context clarification codes.
- Matched and no-protocol action outcomes.
- Protocol-only decision/guidance/reference source.
- Specific Protocol priority over generic Protocol.
- Photo record ID preservation.
- AI infrastructure error no-persist behavior.
- Regressions proving old local keyword parser is not used.

### Notes

- No DB migration or dependency changes.
- No secret or `.env.local` changes.

### Fix Round 1

Review requested stronger deterministic safety bypass, defensive invalid-AI-result handling, and removal of the external AI call from the service transaction boundary.

RED:

- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home GRADLE_USER_HOME=/private/tmp/mallo-gradle ./gradlew test --tests '*AskServiceTest' --tests '*AskControllerTest'`
- Result: BUILD FAILED, 26 focused test failures.
- Failures proved medication/treatment phrases still reached AI, `병풀` falsely matched bare `병`, invalid AI results produced NPE/IllegalArgumentException/500 paths, and the mocked `AiTriagePort` observed an active transaction.

GREEN:

- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home GRADLE_USER_HOME=/private/tmp/mallo-gradle ./gradlew test --tests '*AskServiceTest' --tests '*AskControllerTest'`
- Result: BUILD SUCCESSFUL.
- `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home GRADLE_USER_HOME=/private/tmp/mallo-gradle ./gradlew test`
- Result: BUILD SUCCESSFUL.
- `git diff --check`
- Result: no output.
- `rg -n "@Transactional|ACTION_KEYWORDS|RECOVERY_KEYWORDS|extractAction|extractContext|extractOne|Set\\.of\\(\\\"운동\\\"|\\\"헬스\\\"|\\\"약\\\"|\\\"병\\\"" backend/src/main/java/com/mallo/backend/domain/interaction/service/AskService.java`
- Result: no matches.
- `rg -n "sk-|OPENROUTER|OPENROUTER_API_KEY|AI_SHARED_SECRET|Bearer" backend/src/main/java/com/mallo/backend/domain/interaction/service/AskService.java backend/src/test/java/com/mallo/backend/domain/interaction/service/AskServiceTest.java backend/src/test/java/com/mallo/backend/domain/interaction/controller/AskControllerTest.java .superpowers/sdd/2026-08-20-mallo-ai-triage-service/task-7-report.md`
- Result: no matches.

Changes:

- Restored deterministic medication/treatment bypass with targeted phrases including `약 먹`, `약먹`, `약을`, `약 추천`, `약추천`, `복용`, `연고`, `항생제`, `진통제`, `스테로이드`, `처방`, `용량`, and `투약`.
- Removed bare `병` from high-risk matching and retained precise diagnosis phrases such as `질환`, `병인가`, `감염인가`, `의사처럼`, and `전문가처럼`.
- Added regressions proving `약산성` and `병풀` do not trigger high-risk bypass.
- Added explicit parsers for route, action state, action, complete context, and clarification code so null/unknown AI results map to `CustomException(AI_INVALID_RESPONSE)`.
- Removed method-level `@Transactional`; controller regression proves `TransactionSynchronizationManager.isActualTransactionActive()` is false inside the mocked `AiTriagePort` call.
- Added controller 502 regressions for invalid AI result and AI `CustomException`.
