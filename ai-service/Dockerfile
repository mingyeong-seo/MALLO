FROM python:3.13-slim AS builder

COPY --from=ghcr.io/astral-sh/uv:0.8.15 /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev --no-editable --no-install-project

COPY src ./src
RUN uv sync --frozen --no-dev --no-editable

FROM python:3.13-slim AS runtime

ENV PATH="/app/.venv/bin:${PATH}" \
    PYTHONPATH="/app/src" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN groupadd --system mallo \
    && useradd --system --gid mallo --home-dir /app --shell /usr/sbin/nologin mallo

WORKDIR /app

COPY --from=builder --chown=mallo:mallo /app/.venv ./.venv
COPY --from=builder --chown=mallo:mallo /app/src ./src

USER mallo

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "from urllib.request import urlopen; urlopen('http://127.0.0.1:8000/healthz', timeout=3).read()"

CMD ["uvicorn", "mallo_ai.main:app", "--host", "0.0.0.0", "--port", "8000"]
