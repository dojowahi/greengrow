#!/bin/bash
set -e

# Configuration
SERVICE_NAME="greengrow"
REGION="us-central1"
SERVICE_ACCOUNT="genai-592@gen-ai-4all.iam.gserviceaccount.com"

echo "Deploying $SERVICE_NAME to Cloud Run (Region: $REGION)..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud is not installed. Please install the Google Cloud SDK."
    exit 1
fi

# Check if project ID is set
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "Error: No Google Cloud project selected. Please run 'gcloud config set project YOUR_PROJECT_ID'."
    exit 1
fi

echo "Using Project ID: $PROJECT_ID"

# Deploy
# Note: Using --source . triggers a Cloud Build which uses the Dockerfile
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --service-account="$SERVICE_ACCOUNT" \
  --impersonate-service-account="$SERVICE_ACCOUNT" \
  --set-env-vars="GCP_PROJECT=$PROJECT_ID" \
  --allow-unauthenticated

echo "Deployment complete! Your service should be available at the URL above."
