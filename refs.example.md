# References and API Documentation

## API Documentation Links

- **Tavus API Docs**: https://docs.tavus.io/sections/conversational-video-interface/persona/overview
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- **Cloudflare Stream**: https://developers.cloudflare.com/stream/
- **GitHub Repository**: https://github.com/prx0r/Molts.Live

## Setup Instructions

### Required API Keys

1. **Tavus API Key**:
   - Get from: https://app.tavus.io/settings/api-keys
   - Set as: `wrangler secret put TAVUS_API_KEY`

2. **Cloudflare Account**:
   - Account ID: Find in dashboard URL (right sidebar)
   - API Token: Create at https://dash.cloudflare.com/profile/api-tokens

### Database Setup

```bash
# Create D1 database
wrangler d1 create moltslive-db

# Apply schema
wrangler d1 execute moltslive-db --file=./worker/d1/schema.sql

# Set secrets
wrangler secret put TAVUS_API_KEY
# Enter your Tavus API key when prompted
```

### After Setup

Replace this file with your actual refs.md containing your API keys. The actual refs.md is gitignored for security.
