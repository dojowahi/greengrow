# GreenGrow

GreenGrow is a full-stack web application with a React frontend (Vite + Tailwind CSS) and a FastAPI Python backend.

## Features
- **Frontend**: React, Vis.gl Google Maps, Recharts, TailwindCSS.
- **Backend**: FastAPI, Pydantic, Python 3.12, with integrations for Google GenAI and Data Commons.
- **Deployment**: Configured for Google Cloud Run using Docker.

## Capabilities
GreenGrow is designed as a Retail Intelligence platform leveraging geospatial and AI data. Its core capabilities include:
- **Vegetation & Seasonal Analysis**: Connects to Google Earth Engine (Sentinel-2) to analyze NDVI (Normalized Difference Vegetation Index) and detect seasonal transitions around retail locations.
- **Growth & Construction Detection**: Uses Dynamic World and Earth Engine to identify new construction and land disturbance areas near stores.
- **Historical Reporting**: Provides 6-month historical trends of vegetation and building activity to understand local market changes.
- **Location Context**: Integrates with Google Data Commons for demographic data and provides localized weather forecasting.
- **AI-Powered Stocking Actions**: Utilizes Google GenAI (Gemini) to generate context-aware, actionable retail stocking recommendations based on geospatial signals, weather, and local context.


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
