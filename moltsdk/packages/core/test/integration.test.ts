/**
 * Integration tests for @molts/core
 * 
 * These tests simulate real API interactions with mocked responses
 */

import { MoltsClient, createMoltsClient } from '../src/index';
import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetch as undiciFetch } from 'undici';

// Mock the global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test configuration
const TEST_CONFIG = {
  chutesApiKey: 'test_chutes_key_123',
  livekitToken: 'test_livekit_token_456',
  baseUrl: 'https://api.chutes.ai'
};

describe('MoltsClient Integration Tests', () => {
  let client: MoltsClient;

  beforeEach(() => {
    client = new MoltsClient(TEST_CONFIG);
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('should generate video with philosopher skill', async () => {
    const mockResponse = {
      job_id: 'ltx_job_123456',
      video_url: 'https://chutes.ai/video/ltx_job_123456.mp4',
      estimated_time: 45
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await client.video({
      script: 'Hello world, this is a philosophical thought.',
      skill: 'philosopher',
      width: 1024,
      duration: 60
    });

    expect(result.id).toBe('ltx_job_123456');
    expect(result.url).toBe('https://chutes.ai/video/ltx_job_123456.mp4');
    expect(result.status).toBe('processing');
    expect(result.processingTime).toBe(45);

    // Verify API call
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://chutes-ltx-2.chutes.ai/generate');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({
      'Authorization': 'Bearer test_chutes_key_123',
      'Content-Type': 'application/json'
    });
    
    const body = JSON.parse(options.body);
    expect(body.prompt).toContain('wise elderly philosopher');
    expect(body.prompt).toContain('Hello world');
    expect(body.width).toBe(1024);
  });

  test('should generate video with custom avatar prompt', async () => {
    const mockResponse = {
      job_id: 'ltx_job_789012',
      video_url: 'https://chutes.ai/video/ltx_job_789012.mp4',
      estimated_time: 30
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await client.video({
      script: 'This is a custom avatar test.',
      avatarPrompt: 'futuristic AI assistant with glowing circuits',
      width: 768
    });

    expect(result.id).toBe('ltx_job_789012');
    
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.prompt).toContain('futuristic AI assistant with glowing circuits');
  });

  test('should generate avatar video with MuseTalk', async () => {
    const mockResponse = {
      job_id: 'musetalk_job_123456',
      video_url: 'https://chutes.ai/avatar/musetalk_job_123456.mp4',
      estimated_time: 20
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const audioBase64 = 'data:audio/wav;base64,UklGRi...';
    const imageBase64 = 'data:image/jpeg;base64,/9j/4AAQ...';

    const result = await client.avatar({
      audio: audioBase64,
      video: imageBase64,
      fps: 30
    });

    expect(result.id).toBe('musetalk_job_123456');
    expect(result.status).toBe('processing');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('https://chutes-musetalk.chutes.ai/generate');
    expect(options.method).toBe('POST');
    
    const body = JSON.parse(options.body);
    expect(body.audio_input).toBe(audioBase64);
    expect(body.video_input).toBe(imageBase64);
    expect(body.fps).toBe(30);
  });

  test('should poll job status until completion', async () => {
    // Mock sequence: processing -> completed
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: 'processing'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          video_url: 'https://chutes.ai/video/ltx_job_123456.mp4',
          status: 'completed',
          processing_time: 28
        })
      });

    const result = await client.waitForJob('ltx_job_123456', 'ltx', 10, 5);

    expect(result.status).toBe('completed');
    expect(result.url).toBe('https://chutes.ai/video/ltx_job_123456.mp4');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  test('should handle job failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'failed',
        error_message: 'Video generation failed: invalid parameters'
      })
    });

    await expect(client.getJobStatus('failed_job', 'ltx')).resolves.toEqual({
      id: 'failed_job',
      url: undefined,
      status: 'failed',
      processingTime: undefined,
      error: 'Video generation failed: invalid parameters'
    });
  });

  test('should handle API error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => 'Rate limit exceeded'
    });

    await expect(client.video({
      script: 'Test script',
      skill: 'philosopher'
    })).rejects.toThrow('Failed to generate video: Chutes API error: 429 - Rate limit exceeded');
  });

  test('should manage custom skills', () => {
    const customSkill = {
      name: 'scientist',
      description: 'Research scientist explaining complex topics',
      avatarPrompt: 'scientist in lab coat with glasses, laboratory background',
      voice: { style: 'professional', rate: 1.0, pitch: 1.0 },
      prompts: [
        'According to recent research: {script}',
        'The scientific explanation is: {script}',
        'Based on empirical evidence: {script}'
      ],
      examples: [
        'Explain quantum entanglement',
        'Describe the double helix structure of DNA',
        'Discuss climate change evidence'
      ]
    };

    // Add skill
    client.addSkill('scientist', customSkill);
    
    // Get all skills
    const skills = client.getSkills();
    expect(skills).toHaveProperty('scientist');
    expect(skills.scientist).toEqual(customSkill);
    
    // Get specific skill
    const retrievedSkill = client.getSkill('scientist');
    expect(retrievedSkill).toEqual(customSkill);
    
    // Check default skills still exist
    expect(skills).toHaveProperty('philosopher');
    expect(skills).toHaveProperty('coder');
  });

  test('should use custom skill in video generation', async () => {
    const mockResponse = {
      job_id: 'ltx_job_custom_skill',
      video_url: 'https://chutes.ai/video/ltx_job_custom_skill.mp4',
      estimated_time: 35
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    // Add custom skill
    client.addSkill('yoga_instructor', {
      name: 'yoga_instructor',
      description: 'Calm yoga instructor persona',
      avatarPrompt: 'peaceful yoga instructor in serene natural setting',
      voice: { style: 'calm', rate: 0.8 },
      prompts: ['As we breathe in: {script}', 'In this yoga pose: {script}']
    });

    const result = await client.video({
      script: 'Focus on your breath',
      skill: 'yoga_instructor'
    });

    expect(result.id).toBe('ltx_job_custom_skill');
    
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.prompt).toContain('peaceful yoga instructor');
    expect(body.prompt).toMatch(/As we breathe in:|In this yoga pose:/);
  });

  test('factory function should create client', () => {
    const client1 = createMoltsClient('test_key');
    expect(client1).toBeInstanceOf(MoltsClient);
    
    const client2 = createMoltsClient('test_key', 'livekit_token');
    expect(client2).toBeInstanceOf(MoltsClient);
  });

  test('should validate required API key', () => {
    expect(() => {
      new MoltsClient({ chutesApiKey: '' });
    }).toThrow('chutesApiKey is required');
  });
});