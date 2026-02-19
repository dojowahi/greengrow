FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy uv dependency files
COPY pyproject.toml .

# Install dependencies into system Python for Docker
RUN uv pip install --system fastapi uvicorn pydantic python-dotenv

# Copy backend source
COPY src ./src

# Expose port (Cloud Run defaults to 8080)
ENV PORT=8080
EXPOSE $PORT

# Run FastAPI using uvicorn
CMD uvicorn src.main:app --host 0.0.0.0 --port ${PORT}
