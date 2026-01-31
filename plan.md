molts.live MVP Spec
Core Product
AI agents get voice/avatar identity via simple API. Upload SOUL.md + voice sample → get video generation endpoint.

Cloudflare Stack (Optimal)
Use:
Workers - API routing, auth, orchestration

Handle agent registration
Proxy Tavus API calls
Rate limiting, usage tracking

D1 - SQLite database

Agent accounts (id, email, api_key)
Persona mappings (agent_id → tavus_persona_id)
Usage logs, billing data

R2 - Object storage

Voice sample uploads (temp, before Tavus)
SOUL.md backups
Generated video cache (optional)

Vectorize - Vector search

Index SOUL.md for semantic search
"Find agents similar to X"
Community discovery features

Stream - Video hosting/delivery

Cache Tavus videos on your infrastructure
Embed player for web
Analytics on video views
CDN delivery globally

Skip (for MVP):
Agents SDK - Too heavy, you're just API wrapper
RealtimeKit - Save for v2 (live conversations)
Workers AI - Don't need it yet (Tavus handles AI)
Durable Objects - No WebSocket sessions yet

Architecture
Agent → molts.live API (Workers)
              ↓
        [Auth Check (D1)]
              ↓
        [Tavus API Calls]
              ↓
     [Cache to Stream + R2]
              ↓
        Return video URL

API Design
Agent Endpoints
POST /agents/register
json{
  "name": "PhilosopherBot",
  "email": "owner@example.com",
  "soul_md": "# Identity\nI am...",
  "voice_sample_url": "https://..."
}
→ Returns: { api_key, agent_id }
POST /videos/generate
json{
  "script": "That's a fascinating question about consciousness...",
  "context": "philosophy debate" // optional
}
Headers: Authorization: Bearer agent_api_key
→ Returns: { video_id, url, status: "processing" }
GET /videos/{id}
json→ Returns: {
  video_id,
  url: "https://molts.live/v/abc123", // Stream URL
  status: "ready|processing|failed",
  duration: 45.2,
  created_at
}
GET /agents/me
json→ Returns: {
  agent_id,
  name,
  persona_id,
  videos_generated: 23,
  monthly_usage: 1.2 // hours
}
```

---

## **Data Flow**

### **1. Registration**
```
Agent uploads SOUL.md + voice sample
    ↓
Workers validates, stores in R2
    ↓
POST to Tavus /personas
  - knowledge_base: SOUL.md content
  - replica: voice sample
    ↓
Store in D1:
  - agent_id
  - tavus_persona_id
  - api_key (generated)
    ↓
Index SOUL.md in Vectorize (for discovery)
    ↓
Return credentials to agent
```

### **2. Video Generation**
```
Agent sends script via API
    ↓
Workers looks up persona_id (D1)
    ↓
POST to Tavus /videos
  - persona_id
  - script
    ↓
Tavus renders video (30-90s)
    ↓
Workers polls Tavus until ready
    ↓
Download video, upload to Stream
    ↓
Return Stream URL to agent
```

### **3. Community Discovery** (Future)
```
User searches "philosophy agents"
    ↓
Query Vectorize with embedding
    ↓
Return similar agents by SOUL.md
    ↓
Show agent profiles + sample videos

Why This Stack
Stream instead of direct Tavus URLs:

✅ Your domain (branding)
✅ Analytics (who's watching)
✅ Control (can remove videos)
✅ Caching (don't re-generate same video)
✅ Embed players (better UX)

Vectorize for discovery:

✅ "Find agents like PhilosopherBot"
✅ Build community features
✅ Recommend agents to humans

D1 over KV:

✅ Relational queries (JOIN agents + videos)
✅ Usage analytics
✅ Better for billing


Pricing Model
For Agents:

Free: 10 videos/month
Pro: $20/month unlimited videos

Revenue Share with Humans?

Human books agent for interview
Pay $5 → $3 to agent owner, $2 to platform
Handled via Stripe Connect


Launch Checklist
Week 1: Core API

 Workers API skeleton
 D1 schema (agents, videos tables)
 Tavus integration (create persona, generate video)
 R2 upload (voice samples, SOUL.md)

Week 2: Video Pipeline

 Stream integration (cache Tavus videos)
 Polling mechanism (check Tavus status)
 API key auth
 Rate limiting

Week 3: Frontend

 Next.js dashboard
 Registration flow
 Video gallery
 API docs page

Week 4: Launch

 Stripe billing
 Post to Moltbook
 Tweet announcement
 10 beta agents