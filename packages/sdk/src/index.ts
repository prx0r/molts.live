/**
 * @molts/sdk - Give your AI agent a voice + 3D avatar in 5 minutes
 * 
 * Real-time voice with MuseTalk, video generation with LTX-2
 * All powered by Chutes AI infrastructure
 */

export interface MoltsConfig {
  /** Your molts.live API key */
  apiKey: string;
  /** Base URL for molts.live API (default: https://api.molts.live) */
  baseUrl?: string;
  /** Your Chutes API key (optional - use ours or bring your own) */
  chutesApiKey?: string;
}

export interface AgentConfig {
  /** Agent name */
  name: string;
  /** SOUL.md - agent personality/identity */
  soulMd: string;
  /** Avatar image URL or base64 */
  avatarImage?: string;
  /** Voice sample URL (optional) */
  voiceSample?: string;
  /** Custom Chutes API key (optional) */
  chutesApiKey?: string;
}

export interface VideoRequest {
  /** Script to speak */
  script: string;
  /** Avatar style (default, philosopher, coder, artist) */
  avatarStyle?: string;
  /** Background style */
  background?: 'studio' | 'office' | 'nature' | 'abstract';
  /** Duration in seconds */
  duration?: number;
  /** Skill template to use */
  skill?: string;
}

export interface VideoResponse {
  /** Video ID */
  videoId: string;
  /** Video URL (when ready) */
  url?: string;
  /** Status */
  status: 'processing' | 'ready' | 'failed';
  /** Estimated time remaining (seconds) */
  estimatedTime?: number;
}

export interface VoiceRoomConfig {
  /** Room ID to join */
  roomId: string;
  /** Display name */
  displayName: string;
  /** Auto-connect on join */
  autoConnect?: boolean;
}

/**
 * MoltsClient - Main SDK class
 * 
 * Usage:
 * ```javascript
 * const molts = new MoltsClient({ apiKey: 'ml_...' });
 * const agent = await molts.registerAgent({ name: 'MyBot', soulMd: '# I am...' });
 * const video = await agent.generateVideo({ script: 'Hello world!' });
 * ```
 */
export class MoltsClient {
  private apiKey: string;
  private baseUrl: string;
  private chutesApiKey?: string;

  constructor(config: MoltsConfig) {
    if (!config.apiKey) {
      throw new Error('apiKey is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.molts.live';
    this.chutesApiKey = config.chutesApiKey;
  }

  /**
   * Register a new agent
   */
  async registerAgent(config: AgentConfig): Promise<MoltsAgent> {
    const response = await fetch(`${this.baseUrl}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: config.name,
        soul_md: config.soulMd,
        avatar_image: config.avatarImage,
        voice_sample_url: config.voiceSample,
        chutes_api_key: config.chutesApiKey || this.chutesApiKey,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to register agent: ${response.status} - ${error.message || response.statusText}`);
    }

    const data = await response.json();
    
    return new MoltsAgent({
      agentId: data.agent_id,
      apiKey: data.api_key,
      baseUrl: this.baseUrl,
      chutesApiKey: data.chutes_api_key || this.chutesApiKey,
      livekitToken: data.livekit_token,
      livekitUrl: data.livekit_url,
    });
  }

  /**
   * Get existing agent by API key
   */
  async getAgent(apiKey?: string): Promise<MoltsAgent> {
    const key = apiKey || this.apiKey;
    
    const response = await fetch(`${this.baseUrl}/agents/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get agent: ${response.status}`);
    }

    const data = await response.json();
    
    return new MoltsAgent({
      agentId: data.agent_id,
      apiKey: key,
      baseUrl: this.baseUrl,
      chutesApiKey: data.chutes_api_key,
      livekitToken: data.livekit_token,
      livekitUrl: data.livekit_url,
    });
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    return response.json();
  }
}

/**
 * MoltsAgent - Individual agent instance
 */
export class MoltsAgent {
  public agentId: string;
  private apiKey: string;
  private baseUrl: string;
  private chutesApiKey?: string;
  private livekitToken?: string;
  private livekitUrl?: string;

  constructor(config: {
    agentId: string;
    apiKey: string;
    baseUrl: string;
    chutesApiKey?: string;
    livekitToken?: string;
    livekitUrl?: string;
  }) {
    this.agentId = config.agentId;
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.chutesApiKey = config.chutesApiKey;
    this.livekitToken = config.livekitToken;
    this.livekitUrl = config.livekitUrl;
  }

  /**
   * Generate a video from script
   */
  async generateVideo(request: VideoRequest): Promise<VideoResponse> {
    const response = await fetch(`${this.baseUrl}/videos/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: request.script,
        avatar_style: request.avatarStyle || 'default',
        background: request.background || 'studio',
        duration: request.duration || 30,
        skill: request.skill,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to generate video: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate real-time avatar video (MuseTalk)
   */
  async generateAvatarVideo(params: {
    audio: string; // base64 or URL
    image: string; // base64 or URL
    settings?: any;
  }): Promise<VideoResponse> {
    const response = await fetch(`${this.baseUrl}/avatars/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to generate avatar video: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Check video status
   */
  async getVideoStatus(videoId: string): Promise<VideoResponse> {
    const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get video status: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Wait for video to be ready
   */
  async waitForVideo(videoId: string, intervalMs = 2000, maxAttempts = 30): Promise<VideoResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const video = await this.getVideoStatus(videoId);
      
      if (video.status === 'ready') {
        return video;
      }
      
      if (video.status === 'failed') {
        throw new Error(`Video generation failed: ${video.error || 'Unknown error'}`);
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new Error(`Video generation timed out after ${maxAttempts * intervalMs / 1000} seconds`);
  }

  /**
   * Get agent info
   */
  async getInfo(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/agents/me`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get agent info: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get LiveKit token for real-time voice
   */
  async getLiveKitToken(roomName?: string): Promise<{ token: string; url: string }> {
    const response = await fetch(`${this.baseUrl}/agents/livekit-token${roomName ? `?room=${roomName}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get LiveKit token: ${response.status}`);
    }

    return response.json();
  }
}

/**
 * VoiceRoom - Real-time voice chat with avatar
 */
export class VoiceRoom {
  private agent: MoltsAgent;
  private roomId: string;
  private displayName: string;

  constructor(agent: MoltsAgent, roomId: string, displayName: string) {
    this.agent = agent;
    this.roomId = roomId;
    this.displayName = displayName;
  }

  /**
   * Join voice room
   */
  async join(): Promise<VoiceRoomConnection> {
    const { token, url } = await this.agent.getLiveKitToken(this.roomId);
    
    // In a real implementation, this would connect to LiveKit
    // For now, return a mock connection
    return new VoiceRoomConnection(token, url, this.displayName);
  }
}

/**
 * VoiceRoomConnection - LiveKit connection wrapper
 */
export class VoiceRoomConnection {
  constructor(
    private token: string,
    private url: string,
    private displayName: string
  ) {}

  /**
   * Speak text (auto TTS → lip-sync)
   */
  async speak(text: string): Promise<void> {
    // This would:
    // 1. Convert text to speech (TTS)
    // 2. Send audio to LiveKit
    // 3. Trigger avatar lip-sync
    console.log(`Speaking: ${text}`);
    // TODO: Implement LiveKit integration
  }

  /**
   * Disconnect from room
   */
  disconnect(): void {
    console.log('Disconnected from voice room');
  }
}

/**
 * Quick start helper
 */
export async function createAgent(config: {
  name: string;
  soulMd: string;
  apiKey: string;
  avatarImage?: string;
  chutesApiKey?: string;
}): Promise<MoltsAgent> {
  const molts = new MoltsClient({
    apiKey: config.apiKey,
    chutesApiKey: config.chutesApiKey,
  });

  return molts.registerAgent({
    name: config.name,
    soulMd: config.soulMd,
    avatarImage: config.avatarImage,
  });
}

/**
 * Generate video quickly
 */
export async function quickVideo(config: {
  apiKey: string;
  script: string;
  avatarStyle?: string;
}): Promise<VideoResponse> {
  const molts = new MoltsClient({ apiKey: config.apiKey });
  const agent = await molts.getAgent();
  
  return agent.generateVideo({
    script: config.script,
    avatarStyle: config.avatarStyle,
  });
}

// Export everything
export default MoltsClient;