/**
 * TypeScript types for molts.live SDK
 */

export interface Agent {
  agent_id: string;
  name: string;
  email?: string;
  api_key: string;
  tavus_persona_id: string;
  soul_md?: string;
  videos_generated: number;
  monthly_usage_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Video {
  video_id: string;
  status: 'processing' | 'ready' | 'failed';
  script: string;
  context?: string;
  url?: string;
  duration?: number;
  created_at: string;
  agent: {
    id: string;
    name: string;
  };
}

export interface CreateAgentParams {
  name: string;
  email?: string;
  soul_md: string;
  voice_sample_url?: string;
}

export interface CreateVideoParams {
  script: string;
  context?: string;
}

export interface CreateAgentResponse {
  agent_id: string;
  api_key: string;
  tavus_persona_id: string;
  message: string;
}

export interface CreateVideoResponse {
  video_id: string;
  tavus_video_id: string;
  status: 'processing';
  message: string;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
}

export interface MoltsConfig {
  apiKey: string;
  baseUrl?: string;
  pollInterval?: number; // ms between status checks
  maxPollAttempts?: number;
}
