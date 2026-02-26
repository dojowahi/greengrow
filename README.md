# GreenGrow

GreenGrow is a full-stack web application with a React frontend (Vite + Tailwind CSS) and a FastAPI Python backend.

## Features
- **Frontend**: React, Vis.gl Google Maps, Recharts, TailwindCSS.
- **Backend**: FastAPI, Pydantic, Python 3.12, with integrations for Google GenAI and Data Commons.
- **Deployment**: Configured for Google Cloud Run using Docker.

## Getting Started

### Prerequisites
- Node.js (v20+)
- Python (v3.12+)
- [uv](https://github.com/astral-sh/uv) package manager
- Google Cloud SDK (for deployment)

### Running Locally

You can use the provided script to run the application locally:

```bash
./run_local.sh
```

Alternatively, you can run the components manually:

**Backend:**
```bash
cd backend
uv sync
uv run uvicorn src.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Deployment

The application is deployed using Google Cloud Run. 

### GitHub Actions Deployment

A GitHub Actions workflow is provided in `.github/workflows/deploy.yml` to automatically deploy the application to Cloud Run on pushes to the `main` branch. 

To use this workflow, ensure the following secrets are configured in your GitHub repository:
- `GCP_CREDENTIALS`: A JSON key for a Google Cloud service account with permissions to deploy to Cloud Run and access required resources. 
- `GCP_PROJECT`: Your Google Cloud Project ID.
- `DATA_COMMONS_API_KEY`: Your Data Commons API key.

### Manual Deployment

You can use the provided script for manual deployment:

```bash
./deploy.sh
```

Or deploy directly with `gcloud` pointing to the root directory (which uses the provided `Dockerfile`):

```bash
gcloud run deploy greengrow --source . --region us-central1 --allow-unauthenticated
```
