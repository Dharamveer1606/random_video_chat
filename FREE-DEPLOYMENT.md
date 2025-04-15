# Free Deployment Options for Your Omegle-like App

Here are three free ways to deploy your application:

## 1. Vercel (Recommended for Next.js)

Vercel is the easiest option for Next.js applications and includes free hosting:

1. Create an account at [vercel.com](https://vercel.com)
2. Install Vercel CLI: `npm i -g vercel`
3. Run in your project directory: `vercel login`
4. Deploy: `vercel`
5. Configure environment variables in the Vercel dashboard:
   - NEXTAUTH_URL: Your deployed URL
   - NEXTAUTH_SECRET: Generate a random string
   - GOOGLE_CLIENT_ID: From Google Cloud Console
   - GOOGLE_CLIENT_SECRET: From Google Cloud Console

## 2. Netlify (Also good for Next.js)

1. Create an account at [netlify.com](https://netlify.com)
2. Install Netlify CLI: `npm install -g netlify-cli`
3. Login: `netlify login`
4. Deploy: `netlify deploy`
5. Configure environment variables in the Netlify dashboard

## 3. Railway

1. Create an account at [railway.app](https://railway.app)
2. Create a new project and connect your GitHub repository
3. Deploy with environment variables configured

## Important Notes for Real-Time Features

For all deployment options:

1. **WebSockets Support**: Make sure to use a plan/tier that supports WebSockets for your socket.io functionality
2. **WebRTC**: For video chat, you may need to configure STUN/TURN servers for reliable WebRTC connections
3. **Environment Variables**: Make sure to set all required environment variables in your hosting dashboard

## Get a Free Testing Domain

If you need a domain for testing:
- Vercel gives you a free domain like `your-app.vercel.app`
- Netlify gives you a free domain like `your-app.netlify.app`

## Local Testing Before Deployment

```bash
# Create a production build
npm run build

# Start a local production server
npm start
```

## Instructions to Fix OAuth Error

The "client_id is required" error means you need to:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Navigate to "APIs & Services" > "Credentials"
4. Create OAuth 2.0 Client ID (Web application type)
5. Add authorized redirect URIs:
   - For local: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-app.vercel.app/api/auth/callback/google`
6. Copy the generated Client ID and Client Secret
7. Update your environment variables accordingly 