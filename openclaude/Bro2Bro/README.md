# Bro2Bro 

A viral social app where users send instant "bros" - one tap, one connection, infinite fun.

## Features

- ✅ **One-Tap Bro Sending** - Send a bro instantly with one tap
- ✅ **Bro Types** - Choose from 5 unique bro types (Aggressive, Funny, Cold, Heartbreak, Respect)
- ✅ **Anonymous Mode** - Send bros anonymously with guess-who mechanics
- ✅ **Bro Feed** - Infinite scroll viral feed with trending algorithm
- ✅ **Location-Based Bros** - Find and connect with nearby users
- ✅ **Real-Time** - WebSocket-powered instant notifications
- ✅ **Streak System** - Daily streak tracking
- ✅ **Rate Limiting** - Protection against spam

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Socket.io
- **Database**: PostgreSQL, Prisma ORM
- **Auth**: NextAuth.js (Google OAuth + Credentials)
- **Real-Time**: Socket.io WebSockets

## 🚀 Deploy to Render (Free)

### Step 1: Create Database
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New +** → **PostgreSQL**
3. Name: `bro2bro-db`
4. Click **Create Database**
5. Copy the **Internal Database URL**

### Step 2: Create Web Service
1. Click **New +** → **Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name**: `bro2bro`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     npm install && npx prisma generate && npx prisma migrate deploy && npm run build
     ```
   - **Start Command**: `npm start`
4. Click **Create Web Service**

### Step 3: Add Environment Variables

Go to **Environment** tab and add:

| Variable | Value | Required |
|----------|-------|----------|
| `DATABASE_URL` | Your Render Postgres URL | ✅ |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` | ✅ |
| `NEXTAUTH_URL` | `https://bro2bro.onrender.com` | ✅ |
| `NEXT_PUBLIC_SOCKET_URL` | `https://bro2bro.onrender.com` | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `GOOGLE_CLIENT_ID` | From Google Console | ❌ |
| `GOOGLE_CLIENT_SECRET` | From Google Console | ❌ |

### Step 4: Deploy
Click **Deploy** - your app will be live in ~5 minutes!

### Google OAuth Setup (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://bro2bro.onrender.com/api/auth/callback/google`
4. Copy Client ID/Secret to Render env vars

## Local Development

```bash
# Clone repo
git clone https://github.com/yourusername/Bro2Bro.git
cd Bro2Bro

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
npx prisma migrate dev

# Start dev server
npm run dev

# In another terminal, start socket server
npm run dev:socket
```

## Environment Variables

See `.env.example` for all available options.

## License

MIT
