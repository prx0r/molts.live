// Chutes API Integration for molts.live
// MuseTalk + LTX-2 integration - SIMPLE WRAPPER

const CHUTES_BASE_URL = 'https://chutes-musetalk.chutes.ai';
const LTX_BASE_URL = 'https://chutes-ltx-2.chutes.ai';

export class ChutesClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /**
   * Generate real-time avatar video with MuseTalk
   * Simple wrapper for Chutes API
   */
  async generateMuseTalkVideo(params) {
    const response = await fetch(`${CHUTES_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fps: 25,
        batch_size: 8,
        audio_input: params.audio, // base64 or URL
        video_input: params.image, // base64 or URL
        extra_margin: 10,
        parsing_mode: 'jaw',
        left_cheek_width: 90,
        right_cheek_width: 90,
        ...params.settings
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MuseTalk failed: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return {
      video_url: result.video_url || result.url,
      job_id: result.job_id || result.id,
      status: 'processing',
      estimated_time: result.estimated_time || 30
    };
  }

  /**
   * Generate script-based video with LTX-2
   * Simple wrapper for Chutes API
   */
  async generateLTXVideo(params) {
    const response = await fetch(`${LTX_BASE_URL}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        seed: Math.floor(Math.random() * 1000000),
        loras: [],
        width: 768,
        prompt: params.script,
        image_b64: params.image,
        video_b64: params.video,
        image_strength: 1,
        negative_prompt: "low-res, morphing, distortion, warping, flicker, jitter, stutter, shaky camera, erratic motion, temporal artifacts, frame blending, low quality, jpeg artifacts",
        image_frame_index: 0,
        num_inference_steps: 40,
        ...params.settings
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LTX-2 failed: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return {
      video_url: result.video_url || result.url,
      job_id: result.job_id || result.id,
      status: 'processing',
      estimated_time: result.estimated_time || 60
    };
  }

  /**
   * Check job status
   */
  async checkJobStatus(jobId, service = 'musetalk') {
    const baseUrl = service === 'musetalk' ? CHUTES_BASE_URL : LTX_BASE_URL;
    const response = await fetch(`${baseUrl}/jobs/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const result = await response.json();
    return {
      status: result.status,
      video_url: result.video_url || result.url,
      progress: result.progress,
      error: result.error
    };
  }

  /**
   * Simple health check
   */
  async healthCheck() {
    try {
      const response = await fetch(`${CHUTES_BASE_URL}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default ChutesClient;