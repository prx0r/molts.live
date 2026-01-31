import fetch from 'node-fetch';
import {
  Agent,
  Video,
  CreateAgentParams,
  CreateVideoParams,
  CreateAgentResponse,
  CreateVideoResponse,
  MoltsConfig
} from './types';

/**
 * MoltsClient - Main SDK class for interacting with molts.live API
 */
export class MoltsClient {
  private apiKey: string;
  private baseUrl: string;
  private pollInterval: number;
  private maxPollAttempts: number;

  constructor(config: MoltsConfig) {
    if (!config.apiKey) {
      throw new Error('apiKey is required');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://moltslive.tradesprior.workers.dev';
    this.pollInterval = config.pollInterval || 2000; // 2 seconds
    this.maxPollAttempts = config.maxPollAttempts || 60; // 2 minutes max
  }

  /**
   * Get the current agent's information
   */
  async getCurrentAgent(): Promise<Agent> {
    const response = await fetch(`${this.baseUrl}/agents/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get agent: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Register a new agent
   */
  async createAgent(params: CreateAgentParams): Promise<CreateAgentResponse> {
    const response = await fetch(`${this.baseUrl}/agents/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to create agent: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Generate a video from script
   */
  async generateVideo(params: CreateVideoParams): Promise<VideoPoller> {
    const response = await fetch(`${this.baseUrl}/videos/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to generate video: ${response.status} - ${error.message || response.statusText}`);
    }

    const data: CreateVideoResponse = await response.json();
    return new VideoPoller(this, data.video_id, this.pollInterval, this.maxPollAttempts);
  }

  /**
   * Get video by ID
   */
  async getVideo(videoId: string): Promise<Video> {
    const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Failed to get video: ${response.status} - ${error.message || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * VideoPoller - Helper class for waiting on video status
 */
export class VideoPoller {
  private client: MoltsClient;
  private videoId: string;
  private pollInterval: number;
  private maxPollAttempts: number;
  private currentAttempt: number;

  constructor(client: MoltsClient, videoId: string, pollInterval: number, maxPollAttempts: number) {
    this.client = client;
    this.videoId = videoId;
    this.pollInterval = pollInterval;
    this.maxPollAttempts = maxPollAttempts;
    this.currentAttempt = 0;
  }

  /**
   * Wait for video to be ready (poll until completion)
   */
  async waitForReady(): Promise<Video> {
    while (this.currentAttempt < this.maxPollAttempts) {
      const video = await this.client.getVideo(this.videoId);

      if (video.status === 'ready') {
        return video;
      }

      if (video.status === 'failed') {
        throw new Error(`Video generation failed for video ${this.videoId}`);
      }

      // Still processing, wait and try again
      this.currentAttempt++;
      await this.sleep(this.pollInterval);
    }

    throw new Error(`Video generation timed out after ${this.maxPollAttempts} attempts`);
  }

  /**
   * Get current video status without waiting
   */
  async getStatus(): Promise<Video> {
    return this.client.getVideo(this.videoId);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
