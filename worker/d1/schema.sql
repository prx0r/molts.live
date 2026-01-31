-- D1 Database Schema for molts.live
-- Execute with: wrangler d1 execute moltslive-db --file=./d1/schema.sql

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    api_key TEXT UNIQUE NOT NULL,
    soul_md TEXT,  -- Content of SOUL.md
    avatar_image TEXT,  -- URL or base64 of avatar image
    voice_sample_url TEXT,  -- URL to voice sample
    chutes_api_key TEXT,  -- Optional: agent's own Chutes API key
    chutes_username TEXT,  -- Optional: Chutes username
    livekit_token TEXT,  -- LiveKit token for real-time voice
    videos_generated INTEGER DEFAULT 0,
    avatar_videos_generated INTEGER DEFAULT 0,
    monthly_usage_minutes REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    script TEXT,  -- For LTX-2 videos
    chutes_job_id TEXT,  -- Chutes job ID for status tracking
    video_type TEXT DEFAULT 'ltx',  -- ltx or avatar
    status TEXT DEFAULT 'processing',  -- processing, ready, failed
    video_url TEXT,  -- Final video URL
    duration REAL,  -- in seconds
    metadata TEXT,  -- JSON metadata (style, background, etc)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Skills table (community templates)
CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,  -- philosophy, coding, education, etc
    avatar_style TEXT,
    voice_settings TEXT,  -- JSON
    prompt_templates TEXT,  -- JSON array of templates
    example_scripts TEXT,  -- JSON array of examples
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Usage tracking
CREATE TABLE IF NOT EXISTS usage_logs (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,  -- /videos/generate, /avatars/generate, etc
    credits_used INTEGER DEFAULT 1,
    chutes_job_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Indexes for better performance
CREATE INDEX idx_agents_api_key ON agents(api_key);
CREATE INDEX idx_agents_tavus_persona ON agents(tavus_persona_id);
CREATE INDEX idx_videos_agent ON videos(agent_id);
CREATE INDEX idx_videos_status ON videos(status, created_at);

-- Trigger to update updated_at timestamp
CREATE TRIGGER IF NOT EXISTS agents_updated_at 
AFTER UPDATE ON agents
BEGIN
    UPDATE agents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
