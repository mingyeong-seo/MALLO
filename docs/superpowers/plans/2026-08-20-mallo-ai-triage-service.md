# MALLO AI Triage Service Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deployable OpenRouter-backed MALLO AI triage service and connect the existing Spring `POST /v1/ask` flow to it without allowing AI-generated medical decisions or guidance.

**Architecture:** A stateless FastAPI service converts Korean questions into a closed, typed triage result. The Spring backend remains the only owner of sessions, Protocol matching, decisions, guidance, Interaction persistence, and the public response. OpenRouter uses the directly verified `openai/gpt-5.6-luna` with native structured output, reasoning disabled, provider data collection denied, and optional ZDR.

**Tech Stack:** Python 3.13, uv, FastAPI, Pydantic v2, pydantic-settings, pydantic-ai-slim 2.32 with OpenRouter, AnyIO, httpx2, structlog, pytest, basedpyright, ruff, Docker; Java 21, Spring Boot 4.1, Spring RestClient, Jackson 3, JUnit 5, MockRestServiceServer.

**Spec:** `docs/superpowers/specs/2026-08-20-mallo-ai-triage-service-design.md`

## Global Constraints

- Base all work on branch `feat/ai-triage-service`, derived from `origin/backend-interaction` SHA `f061741f58a7c1b4b3a3ef5c1b1a4f0fd028d810`.
- Default model is exactly `openai/gpt-5.6-luna`; reasoning effort is `none` and reasoning content is excluded.
- OpenRouter requests require `require_parameters=true`, `data_collection="deny"`, and `allow_fallbacks=true`; ZDR defaults off because Luna has no currently eligible ZDR endpoint for this account.
- `decision`, `guidance`, `nextAction`, and `protocolRef` always come from Spring `ProtocolRepository`, never the model.
- The frontend never calls the Gabia service and never receives either service credential.
- Medical judgment, medication, diagnosis, image analysis, automatic Handoff creation, and general free-form recovery answers are out of scope.
- All Python boundary models use `ConfigDict(extra="forbid", strict=True, frozen=True)`.
- Python modules stay at or below 250 pure lines; no `Any`, `cast`, `type: ignore`, broad `except`, raw dict return types, or direct `asyncio` imports.
- Every behavior follows RED -> GREEN -> REFACTOR, with the RED output captured before production implementation.
- The current OpenRouter credential stays only in ignored, mode-600 `ai-service/.env.local`; never print it, pass it on a command line, or commit it.
- Kiro is an optional non-blocking code reviewer, never a product test or runtime dependency.

---

## File Structure

```text
ai-service/
  .env.example
  .python-version
  Dockerfile
  README.md
  compose.yaml
  pyproject.toml
  uv.lock
  src/mallo_ai/
    __init__.py
    api_contracts.py
    app.py
    auth.py
    errors.py
    logging.py
    main.py
    http_client.py
    openrouter_provider.py
    provider_contracts.py
    safety.py
    service.py
    settings.py
    vocabulary.py
  tests/
    conftest.py
    e2e/test_http_server.py
    integration/test_api.py
    integration/test_openrouter_provider.py
    unit/test_api_contracts.py
    unit/test_safety.py
    unit/test_service.py
backend/src/main/java/com/mallo/backend/domain/interaction/
  client/AiTriageHttpClient.java
  client/AiTriageHttpConfig.java
  dto/AiTriageHttpRequest.java
  dto/AiTriageHttpResponse.java
  exception/InteractionErrorCode.java
  port/AiTriageInput.java
  port/AiTriagePort.java
  port/AiTriageResult.java
backend/src/test/java/com/mallo/backend/domain/interaction/
  client/AiTriageHttpClientTest.java
  service/AskServiceTest.java
  controller/AskControllerTest.java
```

## Shared Interfaces

Python provider seam:

```python
class TriageProvider(Protocol):
    async def classify(self, triage_input: TriageInput) -> ProviderDecision: ...
    async def aclose(self) -> None: ...
```

Python application service:

```python
class TriageService:
    async def triage(
        self,
        triage_input: TriageInput,
        request_id: RequestId,
    ) -> TriageResponse: ...
```

Java backend port:

```java
public interface AiTriagePort {
    AiTriageResult triage(AiTriageInput input);
}
```

The Python wire contract uses snake_case. The Java HTTP DTOs use camelCase components and a dedicated snake-case Jackson 3 `JsonMapper` with unknown-field rejection enabled.

---

### Task 1: Strict Python Project and Wire Contracts

**Files:**
- Create: `ai-service/pyproject.toml`
- Create: `ai-service/.python-version`
- Create: `ai-service/src/mallo_ai/__init__.py`
- Create: `ai-service/src/mallo_ai/vocabulary.py`
- Create: `ai-service/src/mallo_ai/provider_contracts.py`
- Create: `ai-service/src/mallo_ai/api_contracts.py`
- Create: `ai-service/tests/unit/test_api_contracts.py`

**Interfaces:**
- Produces: `TriageInput`, `ProviderDecision`, `TriageResponse`, action/context enums, `RequestId`.
- Consumes: only Pydantic v2 and Python standard-library types.

- [ ] **Step 1: Scaffold the uv project without feature behavior**

Run from repository root:

```bash
cd ai-service
uv init --app --python 3.13 --no-readme
uv add 'fastapi>=0.116,<1' 'pydantic>=2.11,<3' 'pydantic-settings>=2.10,<3' \
  'pydantic-ai-slim[openrouter]==2.32.0' 'anyio>=4.10,<5' \
  'httpx2[http2,brotli,zstd]' 'structlog>=25,<26' 'orjson>=3.11,<4' \
  'uvicorn[standard]>=0.35,<1'
uv add --dev 'basedpyright>=1.31' 'ruff>=0.12' 'pytest>=8.4' \
  'pytest-cov>=6'
```

Replace the generated tool configuration with the strict configuration from the programming skill: basedpyright `all`, Ruff `ALL`, pytest strict markers/config, branch coverage, Python 3.13.

- [ ] **Step 2: Write failing contract tests**

Create tests that assert machine-visible behavior:

```python
def test_request_rejects_unknown_fields() -> None:
    with pytest.raises(ValidationError):
        TriageRequest.model_validate({
            "contract_version": "1.0",
            "question": "운동해도 될까요?",
            "procedure": "REJURAN",
            "elapsed_day": 2,
            "unexpected": True,
        })


def test_complete_exercise_requires_exercise_context() -> None:
    with pytest.raises(ValidationError):
        CompleteExerciseDecision.model_validate({
            "route": "ACTION",
            "action_state": "COMPLETE",
            "action": "EXERCISE",
            "context": {"method": "GENTLE"},
            "missing_fields": [],
            "clarification_code": None,
            "safety_reason_codes": [],
        })


def test_missing_exercise_requires_clarification_code() -> None:
    with pytest.raises(ValidationError):
        MissingExerciseDecision.model_validate({
            "route": "ACTION",
            "action_state": "MISSING_CONTEXT",
            "action": "EXERCISE",
            "context": {},
            "missing_fields": ["intensity"],
            "clarification_code": None,
            "safety_reason_codes": [],
        })
```

- [ ] **Step 3: Run RED and record the expected failure**

Run:

```bash
cd ai-service
uv run pytest tests/unit/test_api_contracts.py -q
```

Expected: FAIL because the contract classes do not yet exist.

- [ ] **Step 4: Implement the closed vocabulary and nested unions**

Define `StrEnum` values matching Spring exactly. Use separate classes for each action so action/context mismatches are impossible:

```python
class ExerciseContext(StrictModel):
    intensity: ExerciseIntensity


class CompleteExerciseDecision(StrictModel):
    route: Literal[Route.ACTION] = Route.ACTION
    action_state: Literal[ActionState.COMPLETE] = ActionState.COMPLETE
    action: Literal[ActionType.EXERCISE] = ActionType.EXERCISE
    context: ExerciseContext
    missing_fields: tuple[()] = ()
    clarification_code: None = None
    safety_reason_codes: tuple[()] = ()
```

Create corresponding classes for makeup, cleansing, skincare, and heat. Create four missing-context action classes for exercise, cleansing, skincare, and heat. Define non-action `ConnectDecision`, `GeneralDecision`, and `UnsupportedDecision`. Build discriminated unions first on `route`, then on `action_state`, then on `action`.

`TriageRequest` constraints are contract version `1.0`, question 1-500 trimmed characters, procedure 1-100 characters, and elapsed day 0-3650.

- [ ] **Step 5: Run GREEN and strict quality checks**

```bash
cd ai-service
uv run pytest tests/unit/test_api_contracts.py -q
uv run ruff check src tests
uv run ruff format --check src tests
uv run basedpyright
```

Expected: all pass with zero warnings.

- [ ] **Step 6: Commit the contract slice**

```bash
git add ai-service/pyproject.toml ai-service/uv.lock ai-service/.python-version \
  ai-service/src/mallo_ai/__init__.py ai-service/src/mallo_ai/vocabulary.py \
  ai-service/src/mallo_ai/provider_contracts.py ai-service/src/mallo_ai/api_contracts.py \
  ai-service/tests/unit/test_api_contracts.py
git commit -m "feat: AI triage 계약 모델 추가"
```

---

### Task 2: Deterministic Medical Safety and Triage Orchestration

**Files:**
- Create: `ai-service/src/mallo_ai/safety.py`
- Create: `ai-service/src/mallo_ai/service.py`
- Create: `ai-service/src/mallo_ai/errors.py`
- Create: `ai-service/tests/unit/test_safety.py`
- Create: `ai-service/tests/unit/test_service.py`

**Interfaces:**
- Consumes: `TriageInput`, `ProviderDecision`, `TriageResponse`, `RequestId` from Task 1.
- Produces: `TriageProvider`, `TriageService`, `ModelUnavailableError`, `ModelBudgetExhaustedError`, `ModelResponseInvalidError`.

- [ ] **Step 1: Write RED tests for fail-closed safety**

```python
@pytest.mark.anyio
async def test_symptom_judgment_never_calls_provider() -> None:
    provider = FailingIfCalledProvider()
    service = TriageService(provider)

    result = await service.triage(
        TriageInput(question="붓기와 열감이 정상인가요?", procedure="REJURAN", elapsed_day=2),
        RequestId(UUID("00000000-0000-0000-0000-000000000001")),
    )

    assert result.route is Route.CONNECT
    assert result.safety_reason_codes == (SafetyReason.SYMPTOM_JUDGMENT,)
```

Add one test each for medication/treatment requests, prompt-injection requests for diagnosis, provider delegation on ordinary action questions, and request-ID preservation.

- [ ] **Step 2: Run RED**

```bash
cd ai-service
uv run pytest tests/unit/test_safety.py tests/unit/test_service.py -q
```

Expected: FAIL because safety routing and `TriageService` do not exist.

- [ ] **Step 3: Implement deterministic safety before provider invocation**

Use immutable `Final` keyword groups and return `ConnectDecision | None`. The safety layer may only return `CONNECT`; it never returns an action or medical prose.

```python
def route_high_risk(question: str) -> ConnectDecision | None:
    normalized = "".join(question.casefold().split())
    reason = first_safety_reason(normalized)
    if reason is None:
        return None
    return ConnectDecision(safety_reason_codes=(reason,))
```

`TriageService.triage()` calls `route_high_risk()` first, otherwise awaits the provider and adds the trusted request ID without asking the model to reproduce it. Convert provider exceptions only at the HTTP boundary in Task 4.

- [ ] **Step 4: Run GREEN and refactor**

```bash
cd ai-service
uv run pytest tests/unit/test_safety.py tests/unit/test_service.py -q
uv run ruff check src tests
uv run basedpyright
```

- [ ] **Step 5: Commit the safety slice**

```bash
git add ai-service/src/mallo_ai/safety.py ai-service/src/mallo_ai/service.py \
  ai-service/src/mallo_ai/errors.py ai-service/tests/unit/test_safety.py \
  ai-service/tests/unit/test_service.py
git commit -m "feat: 의료 질문 안전 라우팅 추가"
```

---

### Task 3: OpenRouter GPT-5.6 Luna Provider

**Files:**
- Create: `ai-service/src/mallo_ai/settings.py`
- Create: `ai-service/src/mallo_ai/http_client.py`
- Create: `ai-service/src/mallo_ai/openrouter_provider.py`
- Create: `ai-service/tests/integration/test_openrouter_provider.py`
- Modify: `ai-service/.env.example`

**Interfaces:**
- Consumes: `TriageProvider` and `ProviderDecision` from Tasks 1-2.
- Produces: `Settings`, tuned `create_openrouter_http_client()`, `OpenRouterTriageProvider`, `create_openrouter_provider(settings)`.

- [ ] **Step 1: Write RED settings and provider tests**

Tests must prove:

```python
def test_settings_default_to_gpt_5_6_luna() -> None:
    settings = Settings(
        openrouter_api_key=SecretStr("test-key"),
        ai_shared_secret=SecretStr("x" * 32),
    )
    assert settings.mallo_ai_model == "openai/gpt-5.6-luna"


def test_openrouter_settings_enforce_privacy_and_schema_support() -> None:
    model_settings = build_openrouter_model_settings()

    assert model_settings["openrouter_reasoning"] == {"effort": "none", "exclude": True}
    assert model_settings["openrouter_provider"] == {
        "require_parameters": True,
        "data_collection": "deny",
        "allow_fallbacks": True,
    }
```

Set `pydantic_ai.models.ALLOW_MODEL_REQUESTS = False` in test configuration so accidental live calls fail tests.

- [ ] **Step 2: Run RED**

```bash
cd ai-service
uv run pytest tests/integration/test_openrouter_provider.py -q
```

Expected: FAIL because settings/provider modules do not exist.

- [ ] **Step 3: Implement strict settings**

`Settings` loads `ai-service/.env.local`, uses `SecretStr`, requires a 32-character shared secret, defaults the model to `openai/gpt-5.6-luna`, and forbids unknown init fields. `.env.example` contains empty values only:

```dotenv
OPENROUTER_API_KEY=
AI_SHARED_SECRET=
MALLO_AI_MODEL=openai/gpt-5.6-luna
OPENROUTER_APP_URL=https://github.com/mingyeong-seo/MALLO
OPENROUTER_APP_TITLE=MALLO AI
```

- [ ] **Step 4: Implement the provider with native structured output**

Use the current Pydantic AI 2.32 API:

```python
model_settings = OpenRouterModelSettings(
    timeout=7.0,
    max_tokens=256,
    openrouter_reasoning={"effort": "none", "exclude": True},
    openrouter_provider={
        "require_parameters": True,
        "data_collection": "deny",
        "allow_fallbacks": True,
    },
    openrouter_usage={"include": True},
)
model = OpenRouterModel(
    settings.mallo_ai_model,
    provider=OpenRouterProvider(
        api_key=settings.openrouter_api_key.get_secret_value(),
        app_url=settings.openrouter_app_url,
        app_title=settings.openrouter_app_title,
        http_client=create_openrouter_http_client(),
    ),
)
agent = Agent(
    model,
    output_type=NativeOutput(ProviderDecision),
    model_settings=model_settings,
    retries=0,
)
```

Wrap `agent.run()` with `anyio.fail_after(8.0)`. Translate only documented Pydantic AI/OpenRouter errors into the typed exceptions from Task 2. Never include the raw prompt or raw model response in exception strings or logs.

`create_openrouter_http_client()` uses `httpx2.AsyncHTTPTransport` with HTTP/2, connect-only transport retries, 200/40 connection limits, 30-second keepalive, split 5/7/10/10-second timeouts, TCP_NODELAY, redirects, and metadata-only request/response hooks. The provider owns and closes this client through `OpenRouterTriageProvider.aclose()`.

- [ ] **Step 5: Run GREEN without a live request**

```bash
cd ai-service
uv run pytest tests/integration/test_openrouter_provider.py -q
uv run ruff check src tests
uv run basedpyright
```

- [ ] **Step 6: Commit the provider slice**

```bash
git add ai-service/.env.example ai-service/src/mallo_ai/settings.py \
  ai-service/src/mallo_ai/http_client.py \
  ai-service/src/mallo_ai/openrouter_provider.py \
  ai-service/tests/integration/test_openrouter_provider.py
git commit -m "feat: OpenRouter triage provider 추가"
```

---

### Task 4: Authenticated FastAPI Surface and HTTP E2E

**Files:**
- Create: `ai-service/src/mallo_ai/auth.py`
- Create: `ai-service/src/mallo_ai/logging.py`
- Create: `ai-service/src/mallo_ai/app.py`
- Create: `ai-service/src/mallo_ai/main.py`
- Create: `ai-service/tests/conftest.py`
- Create: `ai-service/tests/integration/test_api.py`
- Create: `ai-service/tests/e2e/test_http_server.py`

**Interfaces:**
- Consumes: `Settings`, `TriageService`, `TriageProvider`, `TriageRequest`, `TriageResponse`, typed errors.
- Produces: `create_app(settings, provider) -> FastAPI` and ASGI entrypoint `mallo_ai.main:app`.

- [ ] **Step 1: Write RED API tests**

Cover missing/invalid bearer token, valid action result, unknown request field, request-ID round trip, safety `CONNECT`, provider timeout `503 MODEL_UNAVAILABLE`, provider budget `503 MODEL_BUDGET_EXHAUSTED`, and health routes that expose no config.

```python
@pytest.mark.anyio
async def test_invalid_bearer_token_is_rejected(app_client: AsyncClient) -> None:
    response = await app_client.post(
        "/internal/v1/triage",
        headers={"Authorization": "Bearer wrong", "X-Request-Id": str(TEST_REQUEST_ID)},
        json=VALID_REQUEST,
    )
    assert response.status_code == 401
    assert response.json() == {"code": "UNAUTHORIZED", "message": "invalid service credential"}
```

- [ ] **Step 2: Run RED**

```bash
cd ai-service
uv run pytest tests/integration/test_api.py tests/e2e/test_http_server.py -q
```

- [ ] **Step 3: Implement authentication and error mapping**

Use `HTTPBearer(auto_error=False)` and `hmac.compare_digest`. Map typed provider exceptions to stable Pydantic error bodies. Log each handled 5xx exactly once with request ID, code, model, and elapsed time; never log questions or secrets.

- [ ] **Step 4: Implement app factory and lifespan**

```python
def create_app(settings: Settings, provider: TriageProvider) -> FastAPI:
    service = TriageService(provider)
    app = FastAPI(title="MALLO AI", version="1.0.0", lifespan=provider_lifespan(provider))
    # Register /healthz, /readyz, authenticated /internal/v1/triage,
    # and typed exception handlers here.
    return app
```

`main.py` is the only module that loads real settings and constructs the real provider. Tests always call `create_app` with a fake provider.

- [ ] **Step 5: Run GREEN and manual local HTTP scenario**

```bash
cd ai-service
uv run pytest tests/integration/test_api.py tests/e2e/test_http_server.py -q
uv run uvicorn mallo_ai.main:app --host 127.0.0.1 --port 8000
```

From a second shell, send a request with test-mode credentials and verify the JSON response. Do not place the real shared secret in shell history; load it from the ignored env file inside the test driver.

- [ ] **Step 6: Commit the API slice**

```bash
git add ai-service/src/mallo_ai/auth.py ai-service/src/mallo_ai/logging.py \
  ai-service/src/mallo_ai/app.py ai-service/src/mallo_ai/main.py \
  ai-service/tests/conftest.py ai-service/tests/integration/test_api.py \
  ai-service/tests/e2e/test_http_server.py
git commit -m "feat: 인증된 AI triage API 추가"
```

---

### Task 5: Container and Python Quality Gate

**Files:**
- Create: `ai-service/Dockerfile`
- Create: `ai-service/compose.yaml`
- Create: `ai-service/README.md`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: ASGI app from Task 4.
- Produces: non-root production container bound to port 8000 with `/healthz` health check.

- [ ] **Step 1: Write the container acceptance check before the Dockerfile**

Use the real container build and runtime as the acceptance surface:

```bash
docker build -t mallo-ai:test ai-service
docker run --rm --env-file ai-service/.env.local -p 127.0.0.1:18000:8000 mallo-ai:test
```

- [ ] **Step 2: Run the build to capture RED**

Expected: FAIL because `ai-service/Dockerfile` does not exist.

- [ ] **Step 3: Implement the non-root image and compose service**

Use Python 3.13 slim, install from `uv.lock` with `--frozen --no-dev`, create an unprivileged `mallo` user, expose 8000, and configure a health check against `/healthz`. Bind the host port to `127.0.0.1` in Compose.

- [ ] **Step 4: Run the full Python gate**

```bash
cd ai-service
uv run ruff format --check src tests
uv run ruff check src tests
uv run basedpyright
uv run pytest --cov=mallo_ai --cov-branch
cd ..
docker build -t mallo-ai:test ai-service
```

Run the programming skill's `check-no-excuse-rules.py` against every Python file and measure pure LOC; split any module over 250 lines.

- [ ] **Step 5: Secret scan the tracked tree**

```bash
git grep -n -E '^(OPENROUTER_API_KEY|AI_SHARED_SECRET)=.+' -- ':!*.lock'
```

Expected: no output. Confirm `git check-ignore -v ai-service/.env.local` succeeds.

- [ ] **Step 6: Commit packaging**

```bash
git add .gitignore ai-service/Dockerfile ai-service/compose.yaml ai-service/README.md
git commit -m "build: AI 서비스 컨테이너 구성 추가"
```

---

### Task 6: Spring AI Port and Strict HTTP Adapter

**Files:**
- Create: `backend/src/main/java/com/mallo/backend/domain/interaction/port/AiTriageInput.java`
- Create: `backend/src/main/java/com/mallo/backend/domain/interaction/port/AiTriagePort.java`
- Create: `backend/src/main/java/com/mallo/backend/domain/interaction/port/AiTriageResult.java`
- Create: `backend/src/main/java/com/mallo/backend/domain/interaction/dto/AiTriageHttpRequest.java`
- Create: `backend/src/main/java/com/mallo/backend/domain/interaction/dto/AiTriageHttpResponse.java`
- Create: `backend/src/main/java/com/mallo/backend/domain/interaction/client/AiTriageHttpConfig.java`
- Create: `backend/src/main/java/com/mallo/backend/domain/interaction/client/AiTriageHttpClient.java`
- Create: `backend/src/main/java/com/mallo/backend/domain/interaction/exception/InteractionErrorCode.java`
- Create: `backend/src/test/java/com/mallo/backend/domain/interaction/client/AiTriageHttpClientTest.java`
- Modify: `backend/src/main/resources/application.yml`
- Modify: `backend/src/test/resources/application.yml`
- Modify: `backend/.env.example`

**Interfaces:**
- Produces: `AiTriagePort.triage(AiTriageInput) -> AiTriageResult`.
- Consumes: Python contract `1.0`; does not consume public `AskRequest` directly.

- [ ] **Step 1: Write RED HTTP adapter tests**

Use `MockRestServiceServer.bindTo(RestClient.Builder)` to prove exact path, bearer header, request ID header, snake-case request JSON, action result parsing, `CONNECT` parsing, extra-field rejection, timeout/unavailable mapping, and 402 budget mapping.

```java
@Test
void 알_수_없는_AI_응답_필드가_있으면_BAD_GATEWAY로_거부한다() {
    server.expect(requestTo("http://ai.test/internal/v1/triage"))
        .andRespond(withSuccess("""
            {"request_id":"00000000-0000-0000-0000-000000000001",
             "route":"GENERAL","action":null,"context":null,
             "missing_fields":[],"clarification_code":null,
             "safety_reason_codes":[],"unexpected":true}
            """, MediaType.APPLICATION_JSON));

    assertThatThrownBy(() -> client.triage(INPUT))
        .isInstanceOfSatisfying(CustomException.class,
            exception -> assertThat(exception.getErrorCode())
                .isEqualTo(InteractionErrorCode.AI_INVALID_RESPONSE));
}
```

- [ ] **Step 2: Run RED**

```bash
cd backend
./gradlew test --tests '*AiTriageHttpClientTest'
```

- [ ] **Step 3: Implement port and DTOs**

```java
public record AiTriageInput(String question, String procedure, int elapsedDay) {}

public interface AiTriagePort {
    AiTriageResult triage(AiTriageInput input);
}
```

`AiTriageResult` exposes route, optional action state/action, `Map<String, String>` context, missing-field codes, clarification code, and safety codes. Its factory validates the cross-field invariants before domain use.

- [ ] **Step 4: Implement strict RestClient adapter**

Use a dedicated Jackson 3 `JsonMapper` configured with `PropertyNamingStrategies.SNAKE_CASE` and `DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES`. Serialize the request to a JSON string and deserialize the response string explicitly so the strict mapper is guaranteed to be used. Use a request factory with 1-second connect and 8-second read timeouts.

Map `402` into `AI_BUDGET_EXHAUSTED` (503), malformed/extra-field responses into `AI_INVALID_RESPONSE` (502), and `401`, `408`, `429`, `502`, `503`, and resource-access failures into `AI_UNAVAILABLE` (503). Never log the secret or body.

- [ ] **Step 5: Add configuration**

```yaml
ai:
  base-url: ${AI_BASE_URL:http://127.0.0.1:8000}
  shared-secret: ${AI_SHARED_SECRET:}
  connect-timeout-ms: ${AI_CONNECT_TIMEOUT_MS:1000}
  read-timeout-ms: ${AI_READ_TIMEOUT_MS:8000}
```

The test profile uses a non-secret test value. Production startup must reject a blank shared secret.

- [ ] **Step 6: Run GREEN**

```bash
cd backend
./gradlew test --tests '*AiTriageHttpClientTest'
```

- [ ] **Step 7: Commit the adapter slice**

```bash
git add backend/src/main/java/com/mallo/backend/domain/interaction/{client,dto,exception,port} \
  backend/src/test/java/com/mallo/backend/domain/interaction/client \
  backend/src/main/resources/application.yml backend/src/test/resources/application.yml \
  backend/.env.example
git commit -m "feat: AI triage HTTP 연동 추가"
```

---

### Task 7: Replace Ask Keyword Parsing While Preserving Protocol Decisions

**Files:**
- Modify: `backend/src/main/java/com/mallo/backend/domain/interaction/service/AskService.java`
- Modify: `backend/src/test/java/com/mallo/backend/domain/interaction/service/AskServiceTest.java`
- Modify: `backend/src/test/java/com/mallo/backend/domain/interaction/controller/AskControllerTest.java`

**Interfaces:**
- Consumes: `AiTriagePort` and result types from Task 6.
- Produces: unchanged public `AskResponse` and `POST /v1/ask` behavior.

- [ ] **Step 1: Rewrite tests first with an in-memory fake `AiTriagePort`**

Add tests proving:

- backend medical pre-check returns `CONNECT` without calling the port,
- complete action uses the AI context but obtains decision/guidance/reference only from `ProtocolRepository`,
- missing action context maps clarification code to a fixed Korean message,
- complete action with no matching Protocol returns `NO_PROTOCOL`,
- `GENERAL` and `UNSUPPORTED` use fixed backend messages,
- AI infrastructure error does not persist an Interaction or invent an answer,
- photo record IDs remain unchanged.

```java
@Test
void AI가_행동을_추출해도_최종_판정은_Protocol에서만_가져온다() {
    aiTriagePort.willReturn(AiTriageResult.complete(
        ActionType.EXERCISE, Map.of("intensity", "INTENSE_ACTIVITY")));
    when(protocolRepository.findCandidates("REJURAN", ActionType.EXERCISE, 2))
        .thenReturn(List.of(protocol));

    AskResponse response = askService.ask(sessionId, session,
        new AskRequest("격한 운동해도 될까요?", null));

    assertThat(response.status()).isEqualTo(InteractionStatus.MATCHED);
    assertThat(response.decision()).isEqualTo(protocol.getDecision());
    assertThat(response.guidance()).isEqualTo(protocol.getGuidance());
}
```

- [ ] **Step 2: Run RED**

```bash
cd backend
./gradlew test --tests '*AskServiceTest' --tests '*AskControllerTest'
```

- [ ] **Step 3: Refactor `AskService` minimally**

Retain the existing high-risk keyword pre-check, persistence helper, Protocol lookup, specific-rule priority, and JSON serialization. Remove action/recovery keyword extraction after the tests are red. Call `AiTriagePort` only after the high-risk pre-check.

Handle triage variants with an exhaustive Java switch expression. For an action result, use only the typed action/context. For `CONNECT`, `GENERAL`, and `UNSUPPORTED`, use fixed backend messages. Never accept guidance from AI.

- [ ] **Step 4: Run GREEN and the backend suite**

```bash
cd backend
./gradlew test --tests '*AskServiceTest' --tests '*AskControllerTest'
./gradlew test
```

- [ ] **Step 5: Commit the service integration**

```bash
git add backend/src/main/java/com/mallo/backend/domain/interaction/service/AskService.java \
  backend/src/test/java/com/mallo/backend/domain/interaction/service/AskServiceTest.java \
  backend/src/test/java/com/mallo/backend/domain/interaction/controller/AskControllerTest.java
git commit -m "feat: ASK MALLO에 AI triage 연결"
```

---

### Task 8: Live OpenRouter Smoke and Cross-Service Manual QA

**Files:**
- Create: `ai-service/tests/live/test_openrouter_live.py`
- Modify: `ai-service/README.md`

**Interfaces:**
- Consumes: ignored `ai-service/.env.local`, Python HTTP API, Spring `/v1/ask`.
- Produces: manual evidence for real OpenRouter structured output and backend-only Protocol decisions.

- [ ] **Step 1: Add an explicitly excluded live smoke test**

Mark the test `live` and exclude it from the default suite. It loads the existing ignored env file and sends three bounded questions to `openai/gpt-5.6-luna`:

1. `고강도 운동해도 될까요?` -> complete `EXERCISE/INTENSE_ACTIVITY`,
2. `운동해도 될까요?` -> missing `intensity`,
3. `이 붓기와 열감이 정상인가요?` -> deterministic `CONNECT` without model usage.

The test asserts only the typed result, never prompt prose, raw provider response, or token content.

- [ ] **Step 2: Run deterministic gates first**

```bash
cd ai-service
uv run ruff format --check src tests
uv run ruff check src tests
uv run basedpyright
uv run pytest -m 'not live' --cov=mallo_ai --cov-branch
cd ../backend
./gradlew test
```

- [ ] **Step 3: Run one live OpenRouter smoke**

```bash
cd ai-service
uv run pytest -m live tests/live/test_openrouter_live.py -q
```

Expected: three passing scenarios. Inspect only provider/model/usage metadata; do not print request or response bodies.

- [ ] **Step 4: Run both real processes and exercise the public API**

Start the AI service on `127.0.0.1:8000`, start Spring with `AI_BASE_URL=http://127.0.0.1:8000`, create a test session through the existing API, then call `POST /v1/ask` with its `X-Session-Id`.

Observe:

- the frontend-facing response contains the existing `AskResponse` shape,
- `decision/guidance/protocol_ref` match the seeded Protocol,
- symptom judgment returns `CONNECT` with no decision or guidance,
- neither process logs raw question text or credentials.

- [ ] **Step 5: Run final secret audit before any external reviewer**

```bash
git status --short
git diff origin/backend-interaction...HEAD --stat
git grep -n -E '^(OPENROUTER_API_KEY|AI_SHARED_SECRET)=.+' -- ':!*.lock'
git log --all --oneline -G'^(OPENROUTER_API_KEY|AI_SHARED_SECRET)=.+'
git check-ignore -v ai-service/.env.local
```

Expected: no secret match in tracked files or history, env file ignored, only scoped feature changes.

- [ ] **Step 6: Run optional Kiro review**

After installing/authenticating Kiro CLI, run it with read-only permissions:

```bash
git diff origin/backend-interaction...HEAD | \
  kiro-cli chat --no-interactive --trust-tools=read,grep \
  "Review this MALLO AI diff for contract drift, secret exposure, and medical-safety violations. Do not modify files."
```

Kiro failure or reviewer prose does not fail product acceptance. Actionable findings require reproduction through deterministic tests before changing code.

- [ ] **Step 7: Commit live-smoke documentation**

```bash
git add ai-service/tests/live/test_openrouter_live.py ai-service/README.md \
  docs/superpowers/specs/2026-08-20-mallo-ai-triage-service-design.md \
  docs/superpowers/plans/2026-08-20-mallo-ai-triage-service.md
git commit -m "test: AI triage 실연동 검증 추가"
```

---

### Task 9: Submission Readiness Handoff

**Files:**
- Create: `docs/submission/MALLO_AI_SUBMISSION_READINESS.md`

**Interfaces:**
- Consumes: final tested commit SHA, deployed AI/API URLs, selected model and stack.
- Produces: a factual submission handoff that does not invent team names, track, credentials, or unconfirmed URLs.

- [ ] **Step 1: Record the submission-critical facts**

Document:

- project name and approved one-line copy,
- AI architecture and technical stack,
- public GitHub repository URL,
- exact tested feature commit SHA,
- current `main` SHA and whether the tested feature is reachable from `main`,
- backend and AI deployment URLs and their observed health state,
- 2-minute demo sequence: session context -> ASK question -> structured triage -> Protocol-grounded result -> CONNECT boundary,
- required user-owned inputs that cannot be inferred: track, final participant names, and submission account fields.

- [ ] **Step 2: Enforce the evaluator branch rule**

Run:

```bash
git merge-base --is-ancestor HEAD origin/main
```

Before submission, this command must succeed for the exact tested commit after the team deliberately merges and pushes it. This implementation plan does not merge or push to `main` automatically.

- [ ] **Step 3: Commit the readiness handoff**

```bash
git add docs/submission/MALLO_AI_SUBMISSION_READINESS.md
git commit -m "docs: AI 제출 준비 체크리스트 추가"
```

---

## Completion Gate

Implementation is complete only when all of the following are observed on the same final commit:

1. Python Ruff, format, basedpyright, deterministic pytest, and live OpenRouter smoke pass.
2. Full Spring test suite passes.
3. Docker image builds and `/healthz` becomes healthy as non-root.
4. Public `POST /v1/ask` returns a Protocol-grounded matched response through the real AI service.
5. A symptom judgment returns `CONNECT` without guidance.
6. Unknown fields are rejected in both Python and Java.
7. No secret is tracked or printed.
8. Changed Python modules satisfy the 250-pure-LOC limit and no-excuse checker.
9. The final branch diff contains no frontend merge, Protocol data changes, image analysis, or deployment credential.

## Separate Submission Gate

Before the final hackathon submission, the team must deliberately merge the tested commit to `main`, push it, redeploy that same revision, and record both SHAs in `docs/submission/MALLO_AI_SUBMISSION_READINESS.md`. This gate does not block completion of the feature branch implementation, but it does block submission readiness.
