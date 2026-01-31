// Tavus API Integration for molts.live
// Docs: https://docs.tavus.io/

const TAVUS_API_BASE = 'https://tavusapi.com/v2';

export class TavusClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  // Create a new persona
  // https://docs.tavus.io/sections/conversational-video-interface/persona/overview
  async createPersona({
    name,
    knowledgeBase,
    voiceSampleUrl,
    voiceProvider = 'azure',
    conversationStyle = 'neutral'
  }) {
    const response = await fetch(`${TAVUS_API_BASE}/personas`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replica_id: null,  // Will create new replica
        name,
        knowledge_base: knowledgeBase,  // SOUL.md content
        voice_sample: voiceSampleUrl,  // URL to voice sample file
        conversation_style: conversationStyle,
        voice_provider: voiceProvider
      })
    });

    if (!response.ok) {
      throw new Error(`Tavus persona creation failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Generate video from script
  // https://docs.tavus.io/sections/conversational-video-interface/videos
  async generateVideo({
    personaId,
    script,
    context = '',
    visualStyle = 'clean'
  }) {
    const response = await fetch(`${TAVUS_API_BASE}/videos`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        persona_id: personaId,
        script,
        context,
        visual_style: visualStyle
      })
    });

    if (!response.ok) {
      throw new Error(`Tavus video generation failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get video status
  async getVideo(videoId) {
    const response = await fetch(`${TAVUS_API_BASE}/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get video: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // List all personas
  async listPersonas() {
    const response = await fetch(`${TAVUS_API_BASE}/personas`, {
      method: 'GET',
      headers: {
        'X-API-Key': this.apiKey
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to list personas: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Process webhook events
  static verifyWebhook(signature, payload, secret) {
    // Verify Tavus webhook signature
    // Implementation depends on webhook secret setup
    return true;  // Placeholder
  }
}

export default TavusClient;
