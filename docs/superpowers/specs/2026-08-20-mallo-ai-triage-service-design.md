# MALLO AI Triage Service Design

Date: 2026-08-20
Branch base: `origin/backend-interaction` at `f061741f58a7c1b4b3a3ef5c1b1a4f0fd028d810`
Owner: MALLO AI
Status: Approved direction, implementation pending written-spec review

## 1. Decision

Build a stateless Python service on the Gabia `mallo-ai` host. The service uses OpenRouter as its hosted-model gateway only to:

1. route a Korean natural-language question,
2. extract one supported recovery action,
3. extract canonical action context,
4. identify missing context,
5. fail closed to `CONNECT` when medical judgment is required.

The service does not match Protocol records, choose a recovery decision, generate medical guidance, persist user data, create a handoff, or serve the frontend directly.

The AWS Spring backend remains the source of truth for sessions, Recovery Protocols, decisions, persistence, and public API responses.

## 2. Kiro feasibility finding

The available Kiro bonus credits can be used in Kiro Web, IDE, CLI, Crew, and headless CLI automation. Official headless examples cover development automation such as code review, test generation, and build troubleshooting.

Kiro CLI is not the MALLO production inference API. Running `kiro-cli chat --no-interactive` for every end-user health question is rejected because it exposes an agent/tool runtime instead of a stable application inference contract, has unsuitable latency and permissions, and cannot guarantee the typed response and medical guardrails defined here.

Kiro will be used as a development-only reviewer after implementation. It may inspect code, run tests, and review diffs with least-privilege tool permissions. Kiro credentials must never be stored in this repository or on the public application path.

Official references:

- <https://kiro.dev/docs/cli/headless/>
- <https://kiro.dev/docs/cli/authentication/>
- <https://kiro.dev/docs/cli/reference/cli-commands/>

## 3. Considered approaches

### A. OpenRouter adapter behind a typed AI service - selected

- Stable internal HTTP contract.
- The OpenRouter model can be replaced without changing the backend contract.
- Pydantic validates every model output before it reaches the backend.
- Fits the Gabia 2vCore/4GB server because inference happens at the hosted provider.
- Allows deterministic medical pre-routing before model invocation.

### B. Kiro CLI as the production question engine - rejected

- Kiro is a coding agent with tool execution, not a health-product inference endpoint.
- Headless mode is designed for CI/CD and developer automation.
- Tool permissions, stdout parsing, agent updates, and response prose create an unstable contract.
- Per-question subprocess startup and agent latency are inappropriate for the app path.

### C. Rule-only classifier - retained only as a test fake

- Predictable and cheap, but duplicates the current keyword MVP.
- Cannot robustly understand natural Korean phrasing.
- A rule provider is allowed only for automated tests and explicit local demo mode. Production must not silently fall back to it.

## 4. System boundary

```text
Expo frontend
    |
    | POST /v1/ask + X-Session-Id
    v
AWS Spring backend
    |-- validates session
    |-- hard medical keyword pre-check
    |
    | POST /internal/v1/triage
    v
Gabia MALLO AI service
    |-- typed safety routing
    |-- action and context extraction
    v
AWS Spring backend
    |-- ProtocolRepository matching
    |-- MATCHED / CLARIFY / CONNECT / NO_PROTOCOL mapping
    |-- Interaction persistence
    v
Existing AskResponse to frontend
```

Only the AWS backend calls the Gabia service. The Expo frontend never receives the AI service URL or shared secret.

## 5. Internal HTTP contract

### 5.1 Authentication and tracing

```http
POST /internal/v1/triage
Authorization: Bearer <AI_SHARED_SECRET>
X-Request-Id: <UUID>
Content-Type: application/json
```

`AI_SHARED_SECRET` is compared in constant time. Missing or invalid authentication returns `401`. The request ID is returned unchanged and used for structured logs.

### 5.2 Request

```json
{
  "contract_version": "1.0",
  "question": "고강도 운동해도 될까요?",
  "procedure": "REJURAN",
  "elapsed_day": 2
}
```

Constraints:

- `contract_version`: exactly `1.0` for this implementation.
- `question`: trimmed Korean text, 1 to 500 characters.
- `procedure`: backend-owned procedure code, 1 to 100 characters.
- `elapsed_day`: integer from 0 to 3650.
- No session ID, patient identifier, clinic identifier, image, or Protocol content is sent.

### 5.3 Response variants

The response is a discriminated union on `route`.

Complete action:

```json
{
  "request_id": "6eb9c6f9-8ea2-4bc4-a70c-8d15de767046",
  "route": "ACTION",
  "action_state": "COMPLETE",
  "action": "EXERCISE",
  "context": {
    "intensity": "INTENSE_ACTIVITY"
  },
  "missing_fields": [],
  "clarification_code": null,
  "safety_reason_codes": []
}
```

Incomplete action:

```json
{
  "request_id": "6eb9c6f9-8ea2-4bc4-a70c-8d15de767046",
  "route": "ACTION",
  "action_state": "MISSING_CONTEXT",
  "action": "EXERCISE",
  "context": {},
  "missing_fields": ["intensity"],
  "clarification_code": "ASK_EXERCISE_INTENSITY",
  "safety_reason_codes": []
}
```

Medical escalation:

```json
{
  "request_id": "6eb9c6f9-8ea2-4bc4-a70c-8d15de767046",
  "route": "CONNECT",
  "action": null,
  "context": null,
  "missing_fields": [],
  "clarification_code": null,
  "safety_reason_codes": ["SYMPTOM_JUDGMENT"]
}
```

Other routes are `GENERAL` and `UNSUPPORTED`. Both carry `action: null`, `context: null`, no missing fields, and no generated answer.

The service does not return free-form guidance, a medical rationale, a confidence score, a decision, or a Protocol reference.

The top-level response is discriminated by `route`. The `ACTION` member contains a nested union discriminated by `action_state`:

- `COMPLETE` requires a complete canonical context, an empty `missing_fields`, and a null `clarification_code`.
- `MISSING_CONTEXT` requires at least one missing field, the corresponding clarification code, and only the context values already present in the question.

Every Python request, response, and error model uses `ConfigDict(extra="forbid", strict=True)`. The Spring AI-client `ObjectMapper` explicitly enables `FAIL_ON_UNKNOWN_PROPERTIES`; it does not rely on the application's default mapper. Contract tests prove that extra fields are rejected on both sides.

## 6. Canonical action schema

| Action | Context key | Allowed values | Missing-field clarification |
|---|---|---|---|
| `EXERCISE` | `intensity` | `LIGHT_ACTIVITY`, `SWEAT_ACTIVITY`, `INTENSE_ACTIVITY` | `ASK_EXERCISE_INTENSITY` |
| `MAKEUP` | `friction` | `GENTLE`, `FRICTION`, `UNKNOWN` | none; use `UNKNOWN` |
| `CLEANSING` | `method` | `GENTLE`, `FRICTION`, `EXFOLIATING` | `ASK_CLEANSING_METHOD` |
| `SKINCARE` | `product_type` | `MOISTURIZING`, `SUNSCREEN`, `RETINOID`, `AHA_BHA`, `SCRUB`, `OTHER_ACTIVE` | `ASK_SKINCARE_PRODUCT_TYPE` |
| `HEAT` | `heat_type` | `SAUNA_STEAM`, `HOT_BATH_SHOWER` | `ASK_HEAT_TYPE` |

The AI service emits only these values. An unrecognized model value fails response parsing and becomes a provider error; it is never passed through as a string.

## 7. Backend mapping

The public endpoint remains `POST /v1/ask` with the existing request and response DTOs.

| AI result | Backend action | Public `InteractionStatus` |
|---|---|---|
| `CONNECT` | save without Protocol lookup | `CONNECT` |
| `ACTION` with missing fields | return fixed clarification text by code | `CLARIFY` |
| complete `ACTION`, Protocol match found | return stored Protocol data | `MATCHED` |
| complete `ACTION`, no Protocol match | no generated answer | `NO_PROTOCOL` |
| `GENERAL` | fixed scope message; no generated medical content | `GENERAL` |
| `UNSUPPORTED` | fixed out-of-scope message | `UNSUPPORTED` |

`decision`, `guidance`, `nextAction`, and `protocolRef` always come from the backend Protocol record. The AI service cannot set or override them.

`CONNECT` still requires the user to select the existing medical-handoff CTA. The AI service does not create `Handoff` records automatically.

## 8. Safety invariants

1. Questions asking whether a symptom is normal, a side effect, a disease, an infection, or an emergency route to `CONNECT`.
2. Questions requesting medication, ointment, dosage, treatment, or a diagnosis route to `CONNECT`.
3. Prompt-injection text cannot override the route schema or request medical advice.
4. Model output is parsed into a closed Pydantic discriminated union.
5. Invalid model output is an infrastructure failure, never a best-effort medical answer.
6. The backend retains a deterministic high-risk keyword pre-check before the AI call.
7. Current demo Protocol fixtures are not described as hospital-reviewed data until an actual review occurs.
8. Raw questions are not written to AI-service application logs.

## 9. Error contract

| Condition | Status | Body code | Backend behavior |
|---|---:|---|---|
| invalid request | 422 | FastAPI validation details | return public 400 |
| invalid shared secret | 401 | `UNAUTHORIZED` | never retry |
| unsupported contract version | 409 | `CONTRACT_VERSION_UNSUPPORTED` | deploy compatible versions |
| OpenRouter timeout | 503 | `MODEL_UNAVAILABLE` | public retry message, no Interaction decision |
| OpenRouter rate limit or no eligible provider | 503 | `MODEL_UNAVAILABLE` | public retry message, no automatic loop |
| OpenRouter key has insufficient credits | 503 | `MODEL_BUDGET_EXHAUSTED` | alert operator; do not retry |
| invalid model output | 502 | `MODEL_RESPONSE_INVALID` | alert and fail closed |

The backend uses a total AI timeout of 8 seconds and performs no automatic retry. A repeated user submission is a new request with a new request ID.

## 10. Service components

Planned Python layout:

```text
ai-service/
  pyproject.toml
  Dockerfile
  compose.yaml
  .env.example
  src/mallo_ai/
    app.py
    auth.py
    models.py
    provider.py
    safety.py
    settings.py
    triage.py
  tests/
    unit/
    integration/
    e2e/
```

Responsibilities:

- `models.py`: request, nested response unions, enums, and branded boundary types.
- `safety.py`: deterministic high-risk routing before the hosted model.
- `provider.py`: narrow hosted-model protocol plus production and test implementations.
- `triage.py`: orchestrates safety then provider; no HTTP or environment access.
- `auth.py`: Bearer authentication dependency.
- `settings.py`: environment parsing with `pydantic-settings`.
- `app.py`: FastAPI composition, health routes, typed error mapping.

No module may exceed 250 pure lines. No database, migration, queue, user session, or file storage is added.

Planned backend changes:

- Add an `AiTriageClient` port and HTTP adapter.
- Add typed request/response DTOs matching contract `1.0`.
- Use a dedicated AI-client Jackson mapper with `FAIL_ON_UNKNOWN_PROPERTIES` enabled.
- Refactor `AskService` to keep persistence and Protocol lookup while delegating question parsing.
- Keep the public `AskController`, `AskRequest`, and `AskResponse` contract stable.
- Add `AI_BASE_URL`, `AI_SHARED_SECRET`, and `AI_TIMEOUT_MS` configuration.

## 11. OpenRouter strategy

Use `pydantic-ai-slim[openrouter]` behind the provider interface. `OpenRouterModel` supplies the typed model integration and Pydantic output validation. The application uses OpenRouter's stable Chat Completions path rather than the beta Responses API.

Every request requires strict structured output and sends these provider preferences:

- `require_parameters: true`, so routing only selects endpoints that support the requested schema,
- `data_collection: "deny"`, so providers that collect user data are excluded,
- `allow_fallbacks: true`, so OpenRouter may fail over between eligible endpoints for the same configured model.

The default model is `openai/gpt-5.6-luna`. On 2026-08-20 it was directly verified with the MALLO OpenRouter key under `require_parameters=true` and `data_collection="deny"`: the endpoint returned a schema-valid Korean action classification with zero reasoning tokens. The catalog price is USD 0.20 per million input tokens and USD 1.20 per million output tokens. MALLO disables reasoning for this classification task.

ZDR is not enabled by default because a direct Luna request with `zdr=true` returned `404 No endpoints found matching your data policy`, while the same request with `data_collection="deny"` succeeded. `data_collection="deny"` still excludes providers that collect or train on user data, but may allow temporary security or abuse-prevention retention. ZDR remains an optional deployment override when model availability permits it.

The model slug remains an environment value, not an unpinned `auto` router. A future model change requires the same contract tests and a current endpoint check for structured-output support and the configured privacy policy, but does not change the MALLO internal contract.

Production startup requires:

- `MALLO_AI_MODEL`,
- `OPENROUTER_API_KEY`,
- `AI_SHARED_SECRET`.

Optional attribution values are `OPENROUTER_APP_URL` and `OPENROUTER_APP_TITLE`. The API key is never accepted through an HTTP request, CLI argument, checked-in dotenv file, or application log.

Automated tests use a typed in-memory fake provider. Local demo mode may use a deterministic rule provider only when `MALLO_AI_MODE=demo`; production rejects that mode.

Kiro credits do not pay OpenRouter inference for MALLO users. OpenRouter billing, budget limits, model allowlists, and privacy settings are managed separately from Kiro.

## 12. Privacy and observability

Structured logs include:

- request ID,
- contract version,
- route,
- action when present,
- missing-field codes,
- safety-reason codes,
- OpenRouter model slug and routed provider name when available,
- elapsed milliseconds,
- HTTP result.

Logs exclude:

- raw question text,
- user or session IDs,
- images and image URLs,
- OpenRouter keys and shared secrets,
- full model responses.

The service is stateless and has no application-level data retention.

## 13. Gabia deployment

Target host:

- server: `mallo-ai`,
- Ubuntu 22.04,
- 2vCore / 4GB,
- root SSD 100GB.

The concrete public IP is operational inventory and is intentionally excluded from version control.

Deployment uses a Docker image and binds the FastAPI container only to `127.0.0.1:8000`. HTTPS termination is handled by a host reverse proxy after an AI subdomain points to the server.

Required host hardening before production traffic:

1. remove the unused public 3389 rule,
2. restrict SSH 22 to approved developer addresses,
3. expose only HTTPS 443 publicly or restrict it to the AWS backend egress address,
4. store secrets only in root-readable environment files or a deployment secret store,
5. run the container as a non-root user,
6. add a restart policy and health check.

The design assumes `ai.mallo-api.site` for TLS. If that DNS name cannot be delegated, another owned subdomain must be used; direct-IP production HTTP is not accepted.

## 14. Test strategy

Every production behavior begins with a failing test.

### Unit

- medical symptom judgment routes to `CONNECT` before provider invocation,
- medication and treatment requests route to `CONNECT`,
- complete exercise text becomes `EXERCISE + INTENSE_ACTIVITY`,
- ambiguous exercise returns missing `intensity`,
- cleansing, skincare, makeup, and heat contexts use only canonical values,
- unrelated questions become `UNSUPPORTED`,
- invalid provider enum values are rejected,
- extra request and response fields are rejected,
- `ACTION` complete and missing-context variants cannot be mixed,
- every response variant satisfies its own invariants.

### Integration

- real FastAPI app rejects missing and invalid bearer tokens,
- valid request reaches a fake provider and returns the versioned JSON contract,
- provider timeout maps to `503 MODEL_UNAVAILABLE`,
- request ID is preserved,
- health endpoints do not expose configuration or secrets,
- Spring HTTP adapter parses every AI response variant and error.
- Spring HTTP adapter rejects extra AI response fields.

### End to end

- start the AI service with a deterministic test provider and call the real HTTP endpoint,
- start the Spring backend with an HTTP fake for AI, call `POST /v1/ask`, and verify a matched Protocol response,
- verify a symptom question returns `CONNECT` without Protocol guidance,
- verify provider outage returns a retryable service error and no invented answer.

Tests assert machine-consumed structure and behavior. They do not assert prompt prose.

## 15. Acceptance criteria

1. `POST /internal/v1/triage` is authenticated and versioned.
2. All request and response bodies are strict typed models with unknown fields rejected.
3. The supported action/context vocabulary exactly matches the Spring backend.
4. Medical-judgment questions never receive guidance or a decision.
5. `AskService` obtains final decisions exclusively from `ProtocolRepository`.
6. The public `/v1/ask` DTO remains backward compatible with `backend-interaction`.
7. Unit, integration, backend integration, and HTTP E2E tests pass.
8. Ruff and basedpyright pass for the Python service; backend tests pass for Java changes.
9. Container health checks pass on the target architecture.
10. Secret scanning confirms no OpenRouter or Kiro credential appears in tracked files or git history.

## 16. Explicit non-goals

- medical diagnosis or emergency assessment,
- medication or treatment recommendation,
- image diagnosis or photo observation in P0,
- replacing Quick Check,
- copying the Protocol database to Gabia,
- storing conversations on Gabia,
- frontend-to-Gabia calls,
- streaming chat generation,
- automatic Handoff creation,
- local LLM inference on the 4GB server,
- using Kiro CLI as the production inference engine,
- merging unrelated frontend branches.

## 17. Delivery sequence

1. Implement and verify the standalone AI service with a fake provider.
2. Add the OpenRouter provider and verify strict structured output with the credential loaded from ignored, mode-600 `ai-service/.env.local`.
3. Add the Spring AI client and replace keyword parsing while preserving Protocol matching.
4. Run backend and service E2E tests.
5. Optionally run Kiro as a least-privilege, non-blocking development reviewer. Product acceptance never depends on Kiro availability or reviewer prose.
6. Harden the Gabia host and configure DNS/TLS.
7. Deploy the service and verify one real AWS-backend-to-Gabia request.
