// LiveKit Integration for molts.live
// Real-time avatar voice platform

const LIVEKIT_API_URL = 'https://api.livekit.cloud';
const LIVEKIT_WS_URL = 'wss://your-project.livekit.cloud';

export class LiveKitClient {
  constructor(apiKey, apiSecret) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  /**
   * Create a LiveKit access token for an agent
   * @param {string} agentId - Unique agent identifier
   * @param {string} roomName - Room name (default: agent's own room)
   * @param {object} metadata - Optional metadata to attach to token
   * @returns {Promise<string>} JWT token
   */
  async createToken(agentId, roomName = `agent-${agentId}`, metadata = {}) {
    // In production, use @livekit/server-sdk
    // For now, implement simple JWT generation
    const payload = {
      sub: agentId,
      name: metadata.name || agentId,
      room: roomName,
      roomJoin: true,
      roomAdmin: false,
      roomCreate: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      agent: true,
      metadata: JSON.stringify(metadata),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
    };

    // Simple JWT implementation (in production, use proper library)
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = await this.signToken(`${header}.${payloadEncoded}`);
    
    return `${header}.${payloadEncoded}.${signature}`;
  }

  /**
   * Generate room token for agent to join
   */
  async generateAgentToken(agentId, agentName, roomName = 'default') {
    return this.createToken(agentId, roomName, {
      name: agentName,
      type: 'agent',
      capabilities: ['speak', 'listen', 'video']
    });
  }

  /**
   * Generate room token for human user
   */
  async generateUserToken(userId, userName, agentId) {
    return this.createToken(userId, `agent-${agentId}`, {
      name: userName,
      type: 'user',
      agentId: agentId
    });
  }

  /**
   * Create a new room (optional - rooms auto-create on first join)
   */
  async createRoom(roomName, options = {}) {
    const response = await fetch(`${LIVEKIT_API_URL}/room`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}:${this.apiSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: roomName,
        emptyTimeout: options.emptyTimeout || 300,
        maxParticipants: options.maxParticipants || 50,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error(`LiveKit room creation failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * List active rooms
   */
  async listRooms() {
    const response = await fetch(`${LIVEKIT_API_URL}/room`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}:${this.apiSecret}`
      }
    });

    if (!response.ok) {
      throw new Error(`LiveKit room list failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get room info
   */
  async getRoom(roomName) {
    const response = await fetch(`${LIVEKIT_API_URL}/room/${encodeURIComponent(roomName)}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}:${this.apiSecret}`
      }
    });

    if (!response.ok) {
      throw new Error(`LiveKit get room failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a room
   */
  async deleteRoom(roomName) {
    const response = await fetch(`${LIVEKIT_API_URL}/room/${encodeURIComponent(roomName)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}:${this.apiSecret}`
      }
    });

    if (!response.ok) {
      throw new Error(`LiveKit delete room failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Sign JWT token (simple implementation)
   * In production, use HMAC-SHA256
   */
  async signToken(data) {
    // Simple signature for demo
    // In production: HMAC-SHA256(data, this.apiSecret)
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const secretBuffer = encoder.encode(this.apiSecret);
    
    // Simple XOR for demo
    const signature = new Uint8Array(dataBuffer.length);
    for (let i = 0; i < dataBuffer.length; i++) {
      signature[i] = dataBuffer[i] ^ secretBuffer[i % secretBuffer.length];
    }
    
    return Buffer.from(signature).toString('base64url');
  }

  /**
   * Get WebSocket URL for frontend
   */
  getWebSocketUrl(roomName) {
    return `${LIVEKIT_WS_URL}/?token=`;
  }
}

export default LiveKitClient;