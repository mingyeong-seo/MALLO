# MALLO AI Service

Internal FastAPI triage service for ASK MALLO. The Spring backend owns sessions,
protocol matching, final recovery guidance, and persistence; this service only
returns the closed triage route/action/context contract.

## Required Environment

Create `ai-service/.env.local` locally. It is ignored by Git and excluded from
the Docker build context.

Add these variables to `ai-service/.env.local`:

- `OPENROUTER_API_KEY`: your OpenRouter key
- `AI_SHARED_SECRET`: `<exactly-32-characters>`
- `MALLO_AI_MODEL`: `openai/gpt-5.6-luna`

`MALLO_AI_MODEL` is optional. The default is `openai/gpt-5.6-luna`.

## Local Quality Gate

```sh
cd ai-service
uv run ruff format --check src tests
uv run ruff check src tests
uv run basedpyright
uv run pytest --cov=mallo_ai --cov-branch
```

## Container

```sh
docker build -t mallo-ai:test ai-service
docker run --rm --env-file ai-service/.env.local -p 127.0.0.1:18000:8000 mallo-ai:test
```

Or from `ai-service`:

```sh
docker compose up --build
```

Health checks:

```sh
curl http://127.0.0.1:18000/healthz
curl http://127.0.0.1:18000/readyz
```
