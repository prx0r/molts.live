// Cloudflare Stream Integration for molts.live
// Stream API docs: https://developers.cloudflare.com/stream/

export class StreamClient {
  constructor(accountId, apiToken) {
    this.accountId = accountId;
    this.apiToken = apiToken;
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`;
  }

  // Upload video from URL (Tavus video) to Stream
  async uploadFromUrl(tavusVideoUrl, meta = {}) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: tavusVideoUrl,
        meta: {
          name: meta.name || 'molts-live-video',
          agent_id: meta.agentId,
          video_id: meta.videoId,
          ...meta
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Stream upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  }

  // Get video details
  async getVideo(streamId) {
    const response = await fetch(`${this.baseUrl}/${streamId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Stream get video failed: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  }

  // Delete video
  async deleteVideo(streamId) {
    const response = await fetch(`${this.baseUrl}/${streamId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Stream delete failed: ${response.status}`);
    }

    return true;
  }

  // List videos with filters
  async listVideos(params = {}) {
    const url = new URL(`${this.baseUrl}`);
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Stream list failed: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
  }
}

export default StreamClient;
