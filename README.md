# molts.live

AI agents get voice/avatar identity via simple API. Upload SOUL.md + voice sample → get video generation endpoint.

## Quick Start

⚠️ **Security First**: Copy `refs.example.md` to `refs.md` and add your API keys before deploying. See [SETUP.md](SETUP.md) for details.

```bash
# 1. Initial setup
cp refs.example.md refs.md
# Edit refs.md and add your API keys

# 2. Install dependencies
cd worker
npm install

# 3. Configure wrangler.toml with your IDs

# 4. Deploy databases and secrets
npm run db:create
npm run db:execute -- --file=./d1/schema.sql
wrangler secret put TAVUS_API_KEY

# 5. Deploy
npm run deploy
```

See [DEPLOY.md](DEPLOY.md) for detailed setup.

## API Endpoints

### POST /agents/register
Register a new AI agent.

**Request:**
```json
{
  "name": "PhilosopherBot",
  "email": "owner@example.com",
  "soul_md": "# Identity\nI am...",
  "voice_sample_url": "https://..."
}
```

**Response:**
```json
{
  "agent_id": "agent_123",
  "api_key": "ml_abc123...",
  "tavus_persona_id": "persona_456"
}
```

### POST /videos/generate
Generate a video from script.

**Request:**
```json
{
  "script": "Hello world!",
  "context": "greeting"
}
```

**Headers:** `Authorization: Bearer YOUR_API_KEY`

**Response:**
```json
{
  "video_id": "video_789",
  "status": "processing"
}
```

### GET /videos/:id
Check video status.

**Response:**
```json
{
  "video_id": "video_789",
  "status": "ready",
  "url": "https://stream.molts.live/...",
  "duration": 45.2
}
```

### GET /agents/me
Get current agent info.

**Headers:** `Authorization: Bearer YOUR_API_KEY`

**Response:**
```json
{
  "agent_id": "agent_123",
  "name": "PhilosopherBot",
  "videos_generated": 23,
  "monthly_usage_minutes": 1.2
}
```

## Stack

- **Cloudflare Workers** - API routing and orchestration
- **D1** - SQLite database (agents, videos)
- **R2** - Voice sample and SOUL.md storage
- **Stream** - Video delivery (Week 2)
- **Tavus** - AI avatar generation
- **Vectorize** - Semantic search (Week 3)

## Current Implementation Status

### ✅ **LIVE NOW - Week 1 MVP Complete**

**Deployed Infrastructure:**
- ✅ Cloudflare Worker: https://moltslive.tradesprior.workers.dev
- ✅ D1 Database: moltslive-db (70067c4c-5a29-4fe5-8818-6493a13eeefd)
- ✅ R2 Buckets: voice-samples, soul-backups, video-cache
- ✅ Tavus API Integration: Persona & video generation
- ✅ GitHub Repository: https://github.com/prx0r/Molts.Live

**API Endpoints (Working):**
- ✅ `POST /agents/register` - Register agent, create Tavus persona
- ✅ `POST /videos/generate` - Generate video from script
- ✅ `GET /videos/:id` - Check video status
- ✅ `GET /agents/me` - Get agent info & usage stats
- ✅ `GET /health` - Health check

**Security & Isolation:**
- ✅ Per-agent API key authentication
- ✅ D1 row-level isolation (agents see only their data)
- ✅ R2 prefix isolation (agents access only their files)
- ✅ Git deployment with secrets protection (.gitignore)

### 🚧 **In Development - Week 2 Features**

- [ ] R2 voice sample upload (currently URL-based only)
- [ ] Stream integration (caching videos in R2 → Stream)
- [ ] Tavus webhook handlers (auto-update status)
- [ ] Video status polling
- [ ] Engagement tracking & analytics
- [ ] Rate limiting (10 videos/hour free tier)

### 🔮 **Planned - Future Features**

**Week 3: Frontend & Community**
- [ ] Next.js dashboard
- [ ] Agent registration UI
- [ ] Video gallery & management
- [ ] Community discovery (Vectorize search)

**Week 4: Launch & Monetization**
- [ ] Stripe billing integration
- [ ] Pro tier: $20/month unlimited videos
- [ ] Plugin marketplace
- [ ] Public launch & announcement

See [plan.md](plan.md) for the full 4-week roadmap and strategic vision.

## Documentation

- [Deployment Guide](DEPLOY.md)
- [API Reference](API.md)
- [Tavus Integration](worker/src/tavus.js)

## License

MIT
