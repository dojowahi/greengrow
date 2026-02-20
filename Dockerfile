FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copy dependency files
COPY backend/pyproject.toml backend/uv.lock ./

# Install dependencies into system Python
RUN uv pip install --system -r pyproject.toml

# Copy backend source
COPY backend/src ./src

# Create static directory and copy frontend build output
RUN mkdir -p static
COPY --from=frontend-build /app/frontend/dist ./static

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080
EXPOSE $PORT

# Start FastAPI using uvicorn
CMD ["sh", "-c", "uvicorn src.main:app --host 0.0.0.0 --port ${PORT}"]
