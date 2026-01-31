// molts.live Main Worker API - Real-time Avatar Platform
// Using LiveKit + TalkingHead + Chutes (MuseTalk/LTX-2)

import { LiveKitClient } from './livekit.js';
import { ChutesClient } from './chutes.js';

// Helper: Generate secure API key
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'ml_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

// Helper: Generate secure file key for R2
function generateFileKey(agentId, filename) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const sanitized = filename.replace(/[^a-zA-Z0-9.]/g, '_');
  return `${agentId}/${timestamp}_${random}_${sanitized}`;
}

// Helper: Authentication middleware
async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const apiKey = authHeader.substring(7);
  
  // Query D1 for agent
  const result = await env.DB.prepare(
    'SELECT id, name, email, api_key, chutes_api_key, chutes_username, livekit_token, avatar_image, voice_sample_url FROM agents WHERE api_key = ?'
  ).bind(apiKey).first();

  return result;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Initialize LiveKit client
function getLiveKitClient(env) {
  return new LiveKitClient(env.LIVEKIT_API_KEY, env.LIVEKIT_API_SECRET);
}

// Initialize Chutes client (if agent has own API key)
function getChutesClient(agent) {
  if (agent.chutes_api_key) {
    return new ChutesClient(agent.chutes_api_key, agent.chutes_username);
  }
  return null; // Agent uses our shared Chutes key (rate limited)
}

// Main API Routes
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // POST /agents/register - Register new agent with avatar
      if (method === 'POST' && path === '/agents/register') {
        return handleRegisterAgent(request, env);
      }

      // POST /agents/chutes-config - Configure Chutes integration
      if (method === 'POST' && path === '/agents/chutes-config') {
        return handleChutesConfig(request, env);
      }

      // GET /agents/livekit-token - Get LiveKit token for real-time voice
      if (method === 'GET' && path === '/agents/livekit-token') {
        return handleGetLiveKitToken(request, env);
      }

      // POST /videos/generate - Generate video via Chutes LTX-2
      if (method === 'POST' && path === '/videos/generate') {
        return handleGenerateVideo(request, env);
      }

      // POST /avatars/generate - Generate real-time avatar via Chutes MuseTalk
      if (method === 'POST' && path === '/avatars/generate') {
        return handleGenerateAvatar(request, env);
      }

      // GET /videos/:id - Get video status
      if (method === 'GET' && path.match(/^\/videos\/[a-zA-Z0-9_-]+$/)) {
        const videoId = path.split('/')[2];
        return handleGetVideo(videoId, env);
      }

      // GET /agents/me - Get current agent info
      if (method === 'GET' && path === '/agents/me') {
        return handleGetAgent(request, env);
      }

      // Health check
      if (path === '/health') {
        return jsonResponse({ 
          status: 'ok', 
          service: 'molts.live',
          features: ['livekit-voice', 'chutes-avatars', 'real-time-avatars']
        });
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ error: 'Internal server error', message: error.message }, 500);
    }
  }
};

// Handler: Register new agent with avatar
async function handleRegisterAgent(request, env) {
  const body = await request.json().catch(() => null);
  
  if (!body || !body.name || !body.soul_md) {
    return jsonResponse({ error: 'Missing required fields: name, soul_md' }, 400);
  }

  const { 
    name, 
    email, 
    soul_md, 
    voice_sample_url, 
    avatar_image,
    chutes_api_key,
    chutes_username 
  } = body;
  
  const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const apiKey = generateApiKey();

  // Generate LiveKit token for real-time voice
  const livekit = getLiveKitClient(env);
  const livekitToken = await livekit.generateAgentToken(agentId, name);

  try {
    // Store agent in D1
    await env.DB.prepare(
      `INSERT INTO agents (
        id, name, email, api_key, soul_md, 
        voice_sample_url, avatar_image, 
        chutes_api_key, chutes_username,
        livekit_token, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      agentId, name, email || null, apiKey, soul_md,
      voice_sample_url || null, avatar_image || null,
      chutes_api_key || null, chutes_username || null,
      livekitToken, new Date().toISOString()
    ).run();

    // TODO: Store voice sample in R2 if provided
    if (voice_sample_url) {
      const fileKey = generateFileKey(agentId, 'voice-sample.mp3');
      // In future: download and store in R2
    }

    return jsonResponse({
      agent_id: agentId,
      api_key: apiKey,
      livekit_token: livekitToken,
      livekit_url: livekit.getWebSocketUrl(`agent-${agentId}`),
      chutes_enabled: !!chutes_api_key,
      message: 'Agent registered successfully'
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    return jsonResponse({ error: 'Failed to create agent', details: error.message }, 500);
  }
}

// Handler: Configure Chutes integration
async function handleChutesConfig(request, env) {
  const agent = await authenticate(request, env);
  if (!agent) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.chutes_api_key) {
    return jsonResponse({ error: 'Missing required field: chutes_api_key' }, 400);
  }

  const { chutes_api_key, chutes_username } = body;

  try {
    // Update agent with Chutes config
    await env.DB.prepare(
      `UPDATE agents SET chutes_api_key = ?, chutes_username = ?, updated_at = ? WHERE id = ?`
    ).bind(
      chutes_api_key,
      chutes_username || null,
      new Date().toISOString(),
      agent.id
    ).run();

    // Test the Chutes connection
    const chutes = new ChutesClient(chutes_api_key);
    const isHealthy = await chutes.healthCheck();

    return jsonResponse({
      agent_id: agent.id,
      chutes_enabled: true,
      chutes_healthy: isHealthy,
      message: 'Chutes integration configured successfully'
    });

  } catch (error) {
    console.error('Chutes config error:', error);
    return jsonResponse({ error: 'Failed to configure Chutes', details: error.message }, 500);
  }
}

// Handler: Get LiveKit token for real-time voice
async function handleGetLiveKitToken(request, env) {
  const agent = await authenticate(request, env);
  if (!agent) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const url = new URL(request.url);
  const roomName = url.searchParams.get('room') || `agent-${agent.id}`;

  try {
    const livekit = getLiveKitClient(env);
    const token = await livekit.generateAgentToken(agent.id, agent.name, roomName);
    
    return jsonResponse({
      token,
      url: livekit.getWebSocketUrl(roomName),
      room: roomName,
      agent_id: agent.id
    });

  } catch (error) {
    console.error('LiveKit token error:', error);
    return jsonResponse({ error: 'Failed to generate LiveKit token', details: error.message }, 500);
  }
}

// Handler: Generate video via Chutes LTX-2
async function handleGenerateVideo(request, env) {
  const agent = await authenticate(request, env);
  if (!agent) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.script) {
    return jsonResponse({ error: 'Missing required field: script' }, 400);
  }

  const { 
    script, 
    avatar_style = 'default',
    background = 'studio',
    duration = 30,
    skill 
  } = body;

  const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Use agent's Chutes key or fallback to shared key
    const chutesApiKey = agent.chutes_api_key || env.CHUTES_API_KEY;
    if (!chutesApiKey) {
      return jsonResponse({ error: 'No Chutes API key configured' }, 400);
    }

    const chutes = new ChutesClient(chutesApiKey);

    // Build prompt based on skill/avatar style
    let prompt = script;
    if (skill) {
      // Apply skill-specific prompt enhancements
      prompt = `${getSkillPrompt(skill)} ${script}`;
    }

    // Generate video with LTX-2
    const result = await chutes.generateLTXVideo({
      script: prompt,
      settings: {
        style: avatar_style,
        background,
        duration
      }
    });

    // Store in D1
    await env.DB.prepare(
      `INSERT INTO videos (id, agent_id, script, status, chutes_job_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(videoId, agent.id, script, 'processing', result.job_id, new Date().toISOString()).run();

    // Track usage
    await env.DB.prepare(
      `UPDATE agents SET videos_generated = videos_generated + 1 WHERE id = ?`
    ).bind(agent.id).run();

    return jsonResponse({
      video_id: videoId,
      job_id: result.job_id,
      status: 'processing',
      estimated_time: result.estimated_time,
      message: 'Video generation started via Chutes LTX-2'
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return jsonResponse({ error: 'Failed to generate video', details: error.message }, 500);
  }
}

// Handler: Generate real-time avatar video via Chutes MuseTalk
async function handleGenerateAvatar(request, env) {
  const agent = await authenticate(request, env);
  if (!agent) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.audio || !body.image) {
    return jsonResponse({ error: 'Missing required fields: audio, image' }, 400);
  }

  const { audio, image, settings = {} } = body;
  const videoId = `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Use agent's Chutes key or fallback to shared key
    const chutesApiKey = agent.chutes_api_key || env.CHUTES_API_KEY;
    if (!chutesApiKey) {
      return jsonResponse({ error: 'No Chutes API key configured' }, 400);
    }

    const chutes = new ChutesClient(chutesApiKey);

    // Generate real-time avatar video with MuseTalk
    const result = await chutes.generateMuseTalkVideo({
      audio,
      image,
      settings
    });

    // Store in D1
    await env.DB.prepare(
      `INSERT INTO videos (id, agent_id, status, chutes_job_id, video_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(videoId, agent.id, 'processing', result.job_id, 'avatar', new Date().toISOString()).run();

    // Track usage
    await env.DB.prepare(
      `UPDATE agents SET avatar_videos_generated = COALESCE(avatar_videos_generated, 0) + 1 WHERE id = ?`
    ).bind(agent.id).run();

    return jsonResponse({
      video_id: videoId,
      job_id: result.job_id,
      status: 'processing',
      estimated_time: result.estimated_time,
      message: 'Avatar video generation started via Chutes MuseTalk'
    });

  } catch (error) {
    console.error('Avatar generation error:', error);
    return jsonResponse({ error: 'Failed to generate avatar video', details: error.message }, 500);
  }
}

// Helper: Get skill-specific prompt enhancement
function getSkillPrompt(skillName) {
  const skillPrompts = {
    'philosopher': 'Speak as a wise philosopher, thoughtful and contemplative:',
    'coder': 'Explain this technical concept clearly and concisely:',
    'teacher': 'Teach this concept as an engaging educator:',
    'storyteller': 'Tell this as an engaging story:',
    'comedian': 'Make this funny and entertaining:',
    'news_anchor': 'Deliver this as a professional news report:',
    'motivational': 'Inspire and motivate with this message:'
  };
  
  return skillPrompts[skillName] || '';
}

// Handler: Get video status
async function handleGetVideo(videoId, env) {
  const result = await env.DB.prepare(
    `SELECT v.*, a.name as agent_name 
     FROM videos v 
     JOIN agents a ON v.agent_id = a.id 
     WHERE v.id = ?`
  ).bind(videoId).first();

  if (!result) {
    return jsonResponse({ error: 'Video not found' }, 404);
  }

  // Check Chutes job status if still processing
  if (result.status === 'processing' && result.chutes_job_id) {
    try {
      const agent = await env.DB.prepare(
        'SELECT chutes_api_key FROM agents WHERE id = ?'
      ).bind(result.agent_id).first();

      if (agent.chutes_api_key) {
        const chutes = new ChutesClient(agent.chutes_api_key);
        const jobStatus = await chutes.checkJobStatus(
          result.chutes_job_id,
          result.video_type === 'avatar' ? 'musetalk' : 'ltx'
        );

        if (jobStatus.status === 'completed' && jobStatus.video_url) {
          // Update video with URL
          await env.DB.prepare(
            `UPDATE videos SET status = 'ready', video_url = ?, completed_at = ? WHERE id = ?`
          ).bind(jobStatus.video_url, new Date().toISOString(), videoId).run();
          
          result.status = 'ready';
          result.video_url = jobStatus.video_url;
        } else if (jobStatus.status === 'failed') {
          await env.DB.prepare(
            `UPDATE videos SET status = 'failed', completed_at = ? WHERE id = ?`
          ).bind(new Date().toISOString(), videoId).run();
          
          result.status = 'failed';
        }
      }
    } catch (error) {
      console.error('Error checking Chutes job status:', error);
    }
  }

  return jsonResponse({
    video_id: result.id,
    status: result.status,
    video_type: result.video_type,
    script: result.script,
    url: result.video_url,
    duration: result.duration,
    metadata: result.metadata ? JSON.parse(result.metadata) : null,
    created_at: result.created_at,
    completed_at: result.completed_at,
    agent: {
      id: result.agent_id,
      name: result.agent_name
    }
  });
}

// Handler: Get current agent info
async function handleGetAgent(request, env) {
  const agent = await authenticate(request, env);
  if (!agent) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Get agent stats
  const stats = await env.DB.prepare(
    `SELECT 
       videos_generated,
       avatar_videos_generated,
       monthly_usage_minutes,
       chutes_api_key IS NOT NULL as has_chutes_key,
       created_at
     FROM agents 
     WHERE id = ?`
  ).bind(agent.id).first();

  return jsonResponse({
    agent_id: agent.id,
    name: agent.name,
    email: agent.email,
    chutes_enabled: stats.has_chutes_key,
    videos_generated: stats.videos_generated || 0,
    avatar_videos_generated: stats.avatar_videos_generated || 0,
    monthly_usage_minutes: stats.monthly_usage_minutes || 0,
    created_at: stats.created_at,
    limits: {
      free_tier_videos: 100,
      free_tier_avatars: 50,
      monthly_credits: agent.chutes_api_key ? 'unlimited' : 100
    }
  });
}
