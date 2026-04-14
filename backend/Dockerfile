# Phase 8: Deployment & Containerization
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Playwright and other libs
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers (Phase 7 support)
RUN pip install playwright && playwright install --with-deps chromium

# Copy application code
COPY . .

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=10000

# Expose port
EXPOSE 10000

# Start command using shell form to allow environment variable expansion
CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
