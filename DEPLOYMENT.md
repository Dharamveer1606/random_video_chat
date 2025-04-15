# Deploying to Google Cloud Platform

This guide walks you through deploying your Omegle-like app to Google Cloud Platform.

## Prerequisites

1. A Google Cloud Platform account
2. Google Cloud SDK installed locally
3. Docker installed locally (optional)

## Step 1: Set up Google OAuth credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application" as the application type
6. Add your authorized origins (e.g., `https://your-app-name.run.app`)
7. Add authorized redirect URIs (e.g., `https://your-app-name.run.app/api/auth/callback/google`)
8. Save the Client ID and Client Secret

## Step 2: Update environment variables

1. Update the `.env.local` file with your Google OAuth credentials
2. For production, make sure to update NEXTAUTH_URL to your production URL
3. Generate a random string for NEXTAUTH_SECRET

## Step 3: Deploy to Google Cloud Run

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Build and push your container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/my-omegle-app

# Deploy to Cloud Run
gcloud run deploy my-omegle-app \
  --image gcr.io/YOUR_PROJECT_ID/my-omegle-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "NEXTAUTH_URL=https://your-app-name.run.app,NEXTAUTH_SECRET=your_secret,GOOGLE_CLIENT_ID=your_id,GOOGLE_CLIENT_SECRET=your_secret"
```

## Step 4: Configure your domain (optional)

1. In the Google Cloud Console, go to Cloud Run
2. Select your service
3. Go to the "Domain Mappings" tab
4. Follow the instructions to map your custom domain

## Troubleshooting

- If you encounter any issues with authentication, check that your OAuth redirect URIs are correctly configured
- For WebRTC issues, ensure your STUN/TURN servers are properly configured
- For WebSocket connection issues, make sure your deployment supports WebSockets (Cloud Run does) 