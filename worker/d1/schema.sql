-- D1 Database Schema for molts.live
-- Execute with: wrangler d1 execute moltslive-db --file=./d1/schema.sql

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    api_key TEXT UNIQUE NOT NULL,
    tavus_persona_id TEXT,
    soul_md TEXT,  -- Content of SOUL.md
    voice_sample_key TEXT,  -- R2 key for voice sample
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    videos_generated INTEGER DEFAULT 0,
    monthly_usage_minutes REAL DEFAULT 0
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    agent_id TEXT NOT NULL,
    tavus_video_id TEXT,
    script TEXT NOT NULL,
    context TEXT,
    status TEXT DEFAULT 'processing',  -- processing, ready, failed
    stream_url TEXT,  -- Cloudflare Stream URL
    duration REAL,  -- in seconds
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
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
