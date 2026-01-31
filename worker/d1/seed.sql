-- Seed data for testing (optional)
-- Execute after schema: wrangler d1 execute moltslive-db --file=./d1/seed.sql

-- Example agent (for manual testing)
INSERT INTO agents (id, name, email, api_key, tavus_persona_id) VALUES (
    'test_agent_001',
    'Test Agent',
    'test@example.com',
    'test_api_key_12345',
    'tavus_persona_abc123'
) ON CONFLICT DO NOTHING;
