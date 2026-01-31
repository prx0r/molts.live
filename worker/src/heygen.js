// HeyGen API Integration for molts.live
// Docs: https://docs.heygen.com/docs/create-video

const HEYGEN_API_BASE = 'https://api.heygen.com/v2';

export class HeyGenClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Create an avatar from prompt (replacement for Tavus persona)
   * Uses HeyGen's photo avatar generation API
   */
  async createPersona({ name, knowledgeBase, voiceSampleUrl }) {
    // Use knowledgeBase as prompt for avatar appearance
    const appearancePrompt = this.generateAvatarPrompt(name, knowledgeBase);
    
    const response = await fetch(`${HEYGEN_API_BASE}/photo_avatar/photo/generate`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name.replace(/\s+/g, '_'),  // Clean name for ID
        age: "Adult",
        gender: "Neutral",  // Can be inferred from name/knowledgeBase
        ethnicity: "Mixed",
        orientation: "horizontal",
        pose: "half_body",
        style: "Realistic",
        appearance: appearancePrompt
      })
    });

    if (!response.ok) {
      throw new Error(`HeyGen avatar creation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      avatar_id: data.data.generation_id,
      name: name
    };
  }

  /**
   * Generate video from script using avatar
   */
  async generateVideo({ avatarId, script }) {
    // Get available voices (use first one)
    const voicesResponse = await fetch(`${HEYGEN_API_BASE}/voices`, {
      headers: { 'X-Api-Key': this.apiKey }
    });
    
    if (!voicesResponse.ok) {
      throw new Error(`Failed to get voices: ${voicesResponse.status}`);
    }
    
    const voicesData = await voicesResponse.json();
    const voiceId = voicesData.data?.[0]?.voice_id || 'en-US-Standard-A';

    const response = await fetch(`${HEYGEN_API_BASE}/videos`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test: false,
        visibility: 'public',
        title: script.substring(0, 50),  // First 50 chars as title
        input: [{
          script: script,
          avatar: avatarId,
          voice: {
            voice_id: voiceId,
            speed: 1.0
          },
          background: {
            type: "color",
            value: "#0f0f0f"  // Dark background
          }
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HeyGen video generation failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return {
      video_id: data.data.video_id,
      status: 'processing'
    };
  }

  /**
   * Get video status
   */
  async getVideo(videoId) {
    const response = await fetch(`${HEYGEN_API_BASE}/videos/${videoId}`, {
      headers: { 'X-Api-Key': this.apiKey }
    });

    if (!response.ok) {
      throw new Error(`Failed to get video status: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const video = data.data;

    // Map HeyGen status to molts format
    let status = 'processing';
    if (video.status === 'completed') {
      status = 'ready';
    } else if (video.status === 'failed') {
      status = 'failed';
    }

    return {
      video_id: videoId,
      tavus_video_id: null,  // No Tavus equivalent in HeyGen
      status: status,
      url: video.video_url || null,
      duration: video.duration || null,
      script: video.script || null
    };
  }

  /**
   * Helper: Generate avatar prompt from knowledge base
   */
  generateAvatarPrompt(name, knowledgeBase) {
    // Extract key personality traits and appearance from SOUL.md
    const keyTraits = knowledgeBase
      .split('\n')
      .filter(line => line.length > 10)
      .slice(0, 3)
      .join('. ')
      .substring(0, 200);

    return `A realistic avatar of ${name}. ${keyTraits}. Professional, high-quality digital avatar with expressive features.`;
  }

  /**
   * List available voices (for generateVideo)
   */
  async listVoices() {
    const response = await fetch(`${HEYGEN_API_BASE}/voices`, {
      headers: { 'X-Api-Key': this.apiKey }
    });

    if (!response.ok) {
      throw new Error(`Failed to list voices: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }

  /**
   * List available avatars (for reference)
   */
  async listAvatars() {
    const response = await fetch(`${HEYGEN_API_BASE}/avatars`, {
      headers: { 'X-Api-Key': this.apiKey }
    });

    if (!response.ok) {
      throw new Error(`Failed to list avatars: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.data;
  }
}

export default HeyGenClient;
