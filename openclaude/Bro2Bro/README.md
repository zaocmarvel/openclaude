# Bro2Bro 🔥

A viral social app for sending instant "bros" - one tap, one connection, infinite fun.

![Bro2Bro Banner](public/banner.png)

## Features

### Core Features
- **One-Tap Bro Sending** - Send a bro instantly with one tap
- **Bro Types** - Choose from 5 unique bro types:
  - 🔥 Aggressive
  - 😂 Funny
  - 🧊 Cold
  - 💔 Heartbreak
  - 👊 Respect
- **Anonymous Mode** - Send bros anonymously with guess-who mechanics
- **Bro Feed** - Infinite scroll viral feed with trending algorithm
- **Location-Based Bros** - Find and connect with nearby users
- **Real-Time** - WebSocket-powered instant notifications and updates
- **Streak System** - Daily streak tracking with 24-hour reset

### Smart Features
- **Bro Suggestions** - ML-powered suggestions based on interaction patterns
- **Viral Feed Ranking** - TikTok/Instagram-like engagement algorithm
- **Personality Profiling** - Track and suggest based on user behavior
- **Safety Features** - Spam detection, rate limiting, abuse prevention

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Next.js API Routes, Socket.io
- **Database**: PostgreSQL, Prisma ORM
- **Auth**: NextAuth.js with Google OAuth
- **Real-Time**: Socket.io WebSockets

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Google OAuth credentials (optional)

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/bro2bro.git
cd bro2bro
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

Edit `.env.local` and add your configuration:

\`\`\`env
DATABASE_URL="postgresql://username:password@localhost:5432/bro2bro?schema=public"
NEXTAUTH_SECRET="your-super-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
\`\`\`

4. Set up the database:
\`\`\`bash
npx prisma db push
npx prisma generate
\`\`\`

5. Run the development server:
\`\`\`bash
npm run dev
# OR for WebSocket support:
npm run dev:socket
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Schema

The app uses a comprehensive schema including:

- **Users** - User profiles, settings, locations
- **Bros** - Bro messages with types and metadata
- **Reactions** - User reactions to bros
- **Streaks** - Daily streak tracking
- **Interaction Logs** - ML training data
- **Personality Profiles** - User behavior analysis
- **Safety Flags** - Abuse detection and moderation

## Architecture

### API Routes

\`\`\`
/api/auth/*           # NextAuth authentication
/api/user/*           # User profile management
/api/bros/*           # Bro CRUD operations
/api/feed/*           # Feed and trending
/api/streaks/*        # Streak management
/api/suggestions/*    # Smart suggestions
/api/nearby/*         # Location-based features
/api/notifications/*  # Notification management
/api/block/*          # Block/unblock users
/api/report/*         # Report users
\`\`\`

### Real-Time Events

Socket.io events for real-time functionality:

**Client to Server:**
- `bro:send` - Send a new bro
- `bro:react` - React to a bro
- `user:location` - Update location
- `user:heartbeat` - Activity heartbeat

**Server to Client:**
- `bro:received` - New bro received
- `bro:reaction` - Someone reacted
- `streak:update` - Streak status changed
- `notification:new` - New notification
- `feed:update` - New feed item
- `user:online/offline` - User presence

### Feed Ranking Algorithm

The viral feed uses a multi-factor ranking system:

\`\`\`
Score = (Engagement_Velocity × Recency_Decay × Quality_Score) + Trending_Boost
\`\`\`

Factors:
- **Engagement Velocity** - Reactions per hour
- **Recency Decay** - Sigmoid function over 24 hours
- **Quality Score** - Engagement rate bonus
- **Trending Boost** - Pre-ranked content multiplier

### Smart Suggestions

Suggestions use a weighted scoring algorithm:

\`\`\`
Score = (Interaction_Frequency × 0.4) +
        (Recency × 0.25) +
        (Active_Streak × 0.2) +
        (Location × 0.1) +
        (Online_Status × 0.05)
\`\`\`

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Self-Hosting

1. Build the application:
\`\`\`bash
npm run build
\`\`\`

2. Start the production server:
\`\`\`bash
npm start
\`\`\`

## Scaling Strategy

### Database Scaling
1. Read replicas for feed queries
2. Connection pooling with PgBouncer
3. Indexing on frequently queried fields
4. Data partitioning by date for interaction logs

### Application Scaling
1. Stateless architecture enables horizontal scaling
2. Redis for session and rate limiting
3. CDN for static assets
4. Load balancer for WebSocket connections

### Feed Optimization
1. Pre-computed trending scores
2. Materialized views for popular content
3. Background job for ranking updates
4. Edge caching for read-heavy endpoints

## Testing

\`\`\`bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e

# Run type checking
npm run type-check
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Design inspired by TikTok/Instagram's addictive UX patterns
- Ranking algorithm based on Reddit's "Hot" and various ML research papers
- Special thanks to the open-source community

---

Built with ❤️ by the Bro2Bro Team
