# Dockerfile for SwapHoot backend on Fly.io.
# Python 3.12 — battle-tested, all packages have prebuilt wheels.
# Stays on a stable LTS-style line so deploy builds are predictable.
FROM python:3.12-slim

# Don't write .pyc files; flush stdout immediately for clean Fly logs.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps. libpq for the psycopg driver, build-essential is only needed
# transiently. Slim image keeps the final size reasonable.
RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps first, separately from app code, so Docker can
# cache the layer when only your app changes.
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the backend.
COPY . .

# Fly will inject PORT=8080 (matches fly.toml internal_port).
EXPOSE 8080

# 2 gunicorn workers is enough for a 256MB Fly machine. Bump later if needed.
# Access logs go to stdout so they show up in `fly logs`.
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8080} --workers 2 --access-logfile - 'app:create_app(\"production\")'"]
