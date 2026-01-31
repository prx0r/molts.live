/**
 * Chutes API Types for molts.live integration
 */

export interface ChutesConfig {
  /** Chutes API key */
  apiKey: string;
  /** Base URL for Chutes API */
  baseUrl?: string;
  /** Chute username (if using personal chutes) */
  username?: string;
}

export interface MuseTalkRequest {
  /** Input audio in base64 or URL */
  audio: string;
  /** Input image in base64 or URL */
  image: string;
  /** Avatar settings */
  settings?: {
    /** Output FPS (default: 25) */
    fps?: number;
    /** Output resolution (default: 512x512) */
    resolution?: [number, number];
    /** Background removal (default: true) */
    remove_bg?: boolean;
  };
}

export interface MuseTalkResponse {
  /** Output video URL */
  video_url: string;
  /** Processing time in seconds */
  processing_time: number;
  /** Status */
  status: 'processing' | 'completed' | 'failed';
}

export interface LTXVideoRequest {
  /** Script text to generate video from */
  script: string;
  /** Avatar/character description */
  character_description?: string;
  /** Video settings */
  settings?: {
    /** Duration in seconds */
    duration?: number;
    /** Style */
    style?: 'realistic' | 'anime' | 'cartoon';
    /** Background */
    background?: string;
  };
}

export interface LTXVideoResponse {
  /** Generated video URL */
  video_url: string;
  /** Processing time in seconds */
  processing_time: number;
  /** Status */
  status: 'processing' | 'completed' | 'failed';
}

export interface RealTimeAvatarConfig {
  /** WebRTC signaling server URL */
  signalingUrl: string;
  /** STUN/TURN servers */
  iceServers?: RTCIceServer[];
  /** Audio codec preference */
  audioCodec?: 'opus' | 'pcm';
  /** Video codec preference */
  videoCodec?: 'vp8' | 'h264';
}

export interface AgentAvatarConfig {
  /** Agent ID */
  agentId: string;
  /** Avatar image URL or base64 */
  avatarImage: string;
  /** Voice settings */
  voice?: {
    /** Voice ID (from ElevenLabs, Cartesia, etc) */
    voiceId?: string;
    /** Voice style */
    style?: 'neutral' | 'happy' | 'sad' | 'angry' | 'excited';
    /** Speaking rate (0.5 to 2.0) */
    rate?: number;
  };
  /** Chutes API config */
  chutes?: ChutesConfig;
}