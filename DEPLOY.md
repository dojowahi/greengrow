# Deployment Guide for GreenGrow

This guide explains how to deploy the GreenGrow application to Google Cloud Run.

## Prerequisites

1.  **Google Cloud SDK**: Ensure `gcloud` CLI is installed and configured.
    -   [Install Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2.  **Google Cloud Project**: You need an active Google Cloud project with billing enabled.
3.  **Permissions**: Your user account needs permissions to deploy to Cloud Run and build container images (Cloud Build).

## Setup

1.  **Login to Google Cloud**:
    ```bash
    gcloud auth login
    ```

2.  **Set your Project ID**:
    ```bash
    gcloud config set project YOUR_PROJECT_ID
    ```

3.  **Enable Required APIs** (if not already enabled):
    ```bash
    gcloud services enable run.googleapis.com cloudbuild.googleapis.com
    ```

## Deployment

### Using the Deployment Script

We have provided a convenient script to automate the deployment process.

1.  **Make the script executable** (first time only):
    ```bash
    chmod +x deploy.sh
    ```

2.  **Run the script**:
    ```bash
    ./deploy.sh
    ```

This script will:
-   Verify `gcloud` is installed and a project is selected.
-   Upload the source code to Google Cloud Build.
-   Build the Docker image using the `Dockerfile`.
-   Deploy the image to Cloud Run.
-   Make the service publicly accessible (allow unauthenticated invocations).

### Manual Deployment

If you prefer to run the commands manually or customize the deployment:

```bash
gcloud run deploy greengrow --source . --region us-central1 --allow-unauthenticated
```

## Troubleshooting

-   **Build Failures**: Check the Cloud Build logs provided in the output. Common issues include missing dependencies or syntax errors in code.
-   **Service Crashes**: Check the Cloud Run logs. Ensure the application listens on the port defined by the `PORT` environment variable (default 8080).
