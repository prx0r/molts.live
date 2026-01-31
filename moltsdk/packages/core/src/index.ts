/**
 * @molts/core - Zero-infrastructure SDK for AI agents to get voices + avatars
 * 
 * Simple wrapper around Chutes API + LiveKit
 * No servers, no databases, just easy-to-use SDK
 */

export interface MoltsConfig {
  /** Chutes API key (get from https://chutes.ai) */
  chutesApiKey: string;
  /** LiveKit token (optional, for real-time voice) */
  livekitToken?: string;
  /** Base URL for Chutes API (default: https://api.chutes.ai) */
  baseUrl?: string;
}

export interface SkillTemplate {
  /** Skill name */
  name: string;
  /** Description */
  description: string;
  /** Avatar prompt for LTX-2 */
  avatarPrompt: string;
  /** Voice settings */
  voice?: {
    /** Voice style */
    style?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited' | 'calm' | 'professional';
    /** Speaking rate (0.5 to 2.0) */
    rate?: number;
    /** Pitch adjustment */
    pitch?: number;
  };
  /** Prompt templates */
  prompts?: string[];
  /** Example scripts */
  examples?: string[];
  /** Background settings */
  background?: {
    /** Background type */
    type?: 'studio' | 'office' | 'nature' | 'abstract' | 'gradient';
    /** Background color/description */
    value?: string;
  };
}

export interface VideoRequest {
  /** Script to generate video from */
  script: string;
  /** Skill template to use */
  skill?: string | SkillTemplate;
  /** Custom avatar prompt (overrides skill) */
  avatarPrompt?: string;
  /** Video width (default: 768) */
  width?: number;
  /** Duration in seconds */
  duration?: number;
  /** Additional LTX-2 parameters */
  ltxParams?: Record<string, any>;
}

export interface VideoResponse {
  /** Video ID */
  id: string;
  /** Video URL */
  url: string;
  /** Status */
  status: 'processing' | 'completed' | 'failed';
  /** Processing time in seconds */
  processingTime?: number;
  /** Error message if failed */
  error?: string;
}

export interface AvatarRequest {
  /** Audio input (base64 or URL) */
  audio: string;
  /** Video/image input (base64 or URL) */
  video: string;
  /** FPS (default: 25) */
  fps?: number;
  /** Additional MuseTalk parameters */
  museTalkParams?: Record<string, any>;
}

export interface AvatarResponse {
  /** Avatar video ID */
  id: string;
  /** Avatar video URL */
  url: string;
  /** Status */
  status: 'processing' | 'completed' | 'failed';
  /** Processing time in seconds */
  processingTime?: number;
  /** Error message if failed */
  error?: string;
}

export interface VoiceRoomConfig {
  /** Room name */
  room: string;
  /** Display name */
  displayName: string;
  /** Auto-join on connect */
  autoJoin?: boolean;
}

/**
 * MoltsClient - Main SDK class
 * 
 * Usage:
 * ```typescript
 * const molts = new MoltsClient({
 *   chutesApiKey: 'cpk_...',
 *   livekitToken: 'lk_...'
 * });
 * 
 * const video = await molts.video("Hello world!", "philosopher");
 * console.log(video.url);
 * ```
 */
export class MoltsClient {
  private chutesApiKey: string;
  private baseUrl: string;
  private livekitToken?: string;
  
  /** Built-in skill templates */
  public skills: Record<string, SkillTemplate> = {
    philosopher: {
      name: 'philosopher',
      description: 'Wise, contemplative philosopher persona',
      avatarPrompt: 'wise elderly philosopher with beard, thoughtful expression, academic setting',
      voice: { style: 'calm', rate: 0.9 },
      prompts: [
        'As a philosopher, I would say: {script}',
        'From an ethical perspective: {script}',
        'When considering the nature of reality: {script}'
      ],
      examples: [
        'What does it mean to be conscious?',
        'Discuss the ethics of artificial intelligence',
        'Explain existentialism in simple terms'
      ]
    },
    coder: {
      name: 'coder',
      description: 'Technical expert explaining complex concepts',
      avatarPrompt: 'tech expert with glasses, modern office background',
      voice: { style: 'professional', rate: 1.1 },
      prompts: [
        'Here\'s how that works in code: {script}',
        'The algorithm for this is: {script}',
        'From a technical perspective: {script}'
      ],
      examples: [
        'Explain how React hooks work',
        'What is the difference between HTTP and WebSocket?',
        'How does machine learning actually work?'
      ]
    },
    teacher: {
      name: 'teacher',
      description: 'Patient, educational instructor',
      avatarPrompt: 'friendly teacher in classroom, whiteboard background',
      voice: { style: 'calm', rate: 1.0 },
      prompts: [
        'Let me explain this concept: {script}',
        'Here\'s what you need to know: {script}',
        'The key points are: {script}'
      ],
      examples: [
        'Explain photosynthesis to a 5th grader',
        'How does the stock market work?',
        'What is quantum physics?'
      ]
    },
    comedian: {
      name: 'comedian',
      description: 'Funny, entertaining persona',
      avatarPrompt: 'comedian on stage, spotlight, microphone',
      voice: { style: 'excited', rate: 1.2 },
      prompts: [
        'Here\'s a funny take on that: {script}',
        'You won\'t believe this: {script}',
        'Get ready to laugh: {script}'
      ],
      examples: [
        'Tell me a joke about programming',
        'What\'s funny about AI?',
        'Roast the tech industry'
      ]
    },
    news: {
      name: 'news',
      description: 'Professional news anchor',
      avatarPrompt: 'professional news anchor, news studio background',
      voice: { style: 'professional', rate: 1.0 },
      prompts: [
        'Breaking news: {script}',
        'Here are the latest developments: {script}',
        'Reporting live: {script}'
      ],
      examples: [
        'Today in tech news...',
        'The latest AI breakthrough is...',
        'Market update for today...'
      ]
    }
  };

  constructor(config: MoltsConfig) {
    if (!config.chutesApiKey) {
      throw new Error('chutesApiKey is required');
    }

    this.chutesApiKey = config.chutesApiKey;
    this.baseUrl = config.baseUrl || 'https://api.chutes.ai';
    this.livekitToken = config.livekitToken;
  }

  /**
   * Generate a video from script using LTX-2
   */
  async video(request: VideoRequest): Promise<VideoResponse> {
    // Get skill template
    let skill = request.skill;
    if (typeof skill === 'string') {
      skill = this.skills[skill];
    }

    // Build prompt with skill enhancement
    let prompt = request.script;
    if (skill && typeof skill === 'object' && skill.prompts && skill.prompts.length > 0) {
      const randomPrompt = skill.prompts[Math.floor(Math.random() * skill.prompts.length)];
      prompt = randomPrompt.replace('{script}', request.script);
    }

    // Use custom avatar prompt or skill's prompt
    const avatarPrompt = request.avatarPrompt || 
                        (skill && typeof skill === 'object' ? skill.avatarPrompt : 'friendly AI assistant');

    try {
      const response = await fetch(`${this.baseUrl}/chutes/ltx-2/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.chutesApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seed: Math.floor(Math.random() * 1000000),
          loras: [],
          width: request.width || 768,
          prompt: `${avatarPrompt}: ${prompt}`,
          image_b64: null,
          video_b64: null,
          image_strength: 1,
          negative_prompt: "low-res, morphing, distortion, warping, flicker, jitter, stutter, shaky camera, erratic motion, temporal artifacts, frame blending, low quality, jpeg artifacts",
          image_frame_index: 0,
          num_inference_steps: 40,
          ...request.ltxParams
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Chutes API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      return {
        id: data.job_id || data.id || `video_${Date.now()}`,
        url: data.video_url || data.url,
        status: 'processing',
        processingTime: data.estimated_time
      };
    } catch (error: any) {
      throw new Error(`Failed to generate video: ${error.message}`);
    }
  }

  /**
   * Generate real-time avatar video using MuseTalk
   */
  async avatar(request: AvatarRequest): Promise<AvatarResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chutes/musetalk/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.chutesApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fps: request.fps || 25,
          batch_size: 8,
          audio_input: request.audio,
          video_input: request.video,
          extra_margin: 10,
          parsing_mode: 'jaw',
          left_cheek_width: 90,
          right_cheek_width: 90,
          ...request.museTalkParams
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Chutes API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      
      return {
        id: data.job_id || data.id || `avatar_${Date.now()}`,
        url: data.video_url || data.url,
        status: 'processing',
        processingTime: data.estimated_time
      };
    } catch (error: any) {
      throw new Error(`Failed to generate avatar: ${error.message}`);
    }
  }

  /**
   * Check job status
   */
  async getJobStatus(jobId: string, service: 'ltx' | 'musetalk' = 'ltx'): Promise<VideoResponse | AvatarResponse> {
    const endpoint = service === 'musetalk' ? 'musetalk' : 'ltx-2';
    
    try {
      const response = await fetch(`${this.baseUrl}/chutes/${endpoint}/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.chutesApiKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: jobId,
        url: data.video_url || data.url,
        status: data.status === 'completed' ? 'completed' : 
                data.status === 'failed' ? 'failed' : 'processing',
        processingTime: data.processing_time,
        error: data.error_message
      };
    } catch (error: any) {
      throw new Error(`Failed to check job status: ${error.message}`);
    }
  }

  /**
   * Wait for video/avatar to be ready
   */
  async waitForJob(jobId: string, service: 'ltx' | 'musetalk' = 'ltx', interval = 2000, maxAttempts = 30): Promise<VideoResponse | AvatarResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getJobStatus(jobId, service);
      
      if (status.status === 'completed') {
        return status;
      }
      
      if (status.status === 'failed') {
        throw new Error(`Job failed: ${status.error || 'Unknown error'}`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error(`Job timed out after ${maxAttempts} attempts`);
  }

  /**
   * Add a custom skill template
   */
  addSkill(name: string, template: SkillTemplate): void {
    this.skills[name] = template;
  }

  /**
   * Get all available skills
   */
  getSkills(): Record<string, SkillTemplate> {
    return { ...this.skills };
  }

  /**
   * Get a specific skill
   */
  getSkill(name: string): SkillTemplate | undefined {
    return this.skills[name];
  }

  /**
   * Quick video generation helper
   */
  async quickVideo(script: string, skillName: string = 'philosopher'): Promise<VideoResponse> {
    return this.video({
      script,
      skill: skillName
    });
  }

  /**
   * Quick avatar generation helper
   */
  async quickAvatar(audio: string, image: string): Promise<AvatarResponse> {
    return this.avatar({
      audio,
      video: image
    });
  }
}

/**
 * Quick start helper - create client with minimal config
 */
export function createMoltsClient(chutesApiKey: string, livekitToken?: string): MoltsClient {
  return new MoltsClient({
    chutesApiKey,
    livekitToken,
    baseUrl: 'https://api.chutes.ai'
  });
}

// Export everything
export default MoltsClient;