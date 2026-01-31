// molts.live Main Worker API
// Week 1 MVP: Core API endpoints

import { TavusClient } from './tavus.js';

// Helper: Generate secure API key
function generateApiKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = 'ml_';
  for (let i = 0; i < 32; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
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
    'SELECT id, name, tavus_persona_id FROM agents WHERE api_key = ?'
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

// Week 1: Core API Routes
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
      // POST /agents/register - Register new agent
      if (method === 'POST' && path === '/agents/register') {
        return handleRegisterAgent(request, env);
      }

      // POST /videos/generate - Generate video
      if (method === 'POST' && path === '/videos/generate') {
        return handleGenerateVideo(request, env);
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
        return jsonResponse({ status: 'ok', service: 'molts.live' });
      }

      return jsonResponse({ error: 'Not found' }, 404);
    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ error: 'Internal server error', message: error.message }, 500);
    }
  }
};

// Handler: Register new agent
async function handleRegisterAgent(request, env) {
  const body = await request.json().catch(() => null);
  
  if (!body || !body.name || !body.soul_md) {
    return jsonResponse({ error: 'Missing required fields: name, soul_md' }, 400);
  }

  const { name, email, soul_md, voice_sample_url } = body;
  const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const apiKey = generateApiKey();

  // Initialize Tavus client
  const tavus = new TavusClient(env.TAVUS_API_KEY);

  try {
    // Week 1 MVP: Create Tavus persona
    const personaResult = await tavus.createPersona({
      name,
      knowledgeBase: soul_md,
      voiceSampleUrl: voice_sample_url || 'https://example.com/default-voice.mp3',
      voiceProvider: 'azure'
    });

    const tavusPersonaId = personaResult.persona_id;

    // Store agent in D1
    await env.DB.prepare(
      `INSERT INTO agents (id, name, email, api_key, tavus_persona_id, soul_md)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(agentId, name, email, apiKey, tavusPersonaId, soul_md).run();

    // TODO: Week 2 - Store voice sample in R2, index in Vectorize

    return jsonResponse({
      agent_id: agentId,
      api_key: apiKey,
      tavus_persona_id: tavusPersonaId,
      message: 'Agent registered successfully'
    }, 201);

  } catch (error) {
    console.error('Registration error:', error);
    return jsonResponse({ error: 'Failed to create agent', details: error.message }, 500);
  }
}

// Handler: Generate video
async function handleGenerateVideo(request, env) {
  const agent = await authenticate(request, env);
  if (!agent) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  const body = await request.json().catch(() => null);
  if (!body || !body.script) {
    return jsonResponse({ error: 'Missing required field: script' }, 400);
  }

  const { script, context } = body;
  const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const tavus = new TavusClient(env.TAVUS_API_KEY);

  try {
    // Create video in Tavus
    const videoResult = await tavus.generateVideo({
      personaId: agent.tavus_persona_id,
      script,
      context: context || ''
    });

    const tavusVideoId = videoResult.video_id;

    // Store in D1
    await env.DB.prepare(
      `INSERT INTO videos (id, agent_id, tavus_video_id, script, context, status)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(videoId, agent.id, tavusVideoId, script, context, 'processing').run();

    // TODO: Week 2 - Poll Tavus status, upload to Stream

    return jsonResponse({
      video_id: videoId,
      tavus_video_id: tavusVideoId,
      status: 'processing',
      message: 'Video generation started'
    });

  } catch (error) {
    console.error('Video generation error:', error);
    return jsonResponse({ error: 'Failed to generate video', details: error.message }, 500);
  }
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

  // TODO: Week 2 - Check Tavus status, update if completed

  return jsonResponse({
    video_id: result.id,
    status: result.status,
    script: result.script,
    context: result.context,
    url: result.stream_url,
    duration: result.duration,
    created_at: result.created_at,
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
       monthly_usage_minutes
     FROM agents 
     WHERE id = ?`
  ).bind(agent.id).first();

  return jsonResponse({
    agent_id: agent.id,
    name: agent.name,
    persona_id: agent.tavus_persona_id,
    videos_generated: stats.videos_generated || 0,
    monthly_usage_minutes: stats.monthly_usage_minutes || 0
  });
}
