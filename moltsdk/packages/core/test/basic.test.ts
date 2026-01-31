/**
 * Basic test for @molts/core
 * 
 * To run: npm test
 */

import { MoltsClient, createMoltsClient } from '../src/index';
import { describe, test, expect, beforeEach, vi } from 'vitest';

// Test configuration
const TEST_CONFIG = {
  chutesApiKey: process.env.CHUTES_API_KEY || 'test_key',
  livekitToken: process.env.LIVEKIT_TOKEN
};

// Mock fetch for testing
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('MoltsClient', () => {
  let client: MoltsClient;

  beforeEach(() => {
    client = new MoltsClient(TEST_CONFIG);
    mockFetch.mockClear();
  });

  test('should create client with config', () => {
    expect(client).toBeInstanceOf(MoltsClient);
  });

  test('should have default skills', () => {
    const skills = client.getSkills();
    expect(skills).toHaveProperty('philosopher');
    expect(skills).toHaveProperty('coder');
    expect(skills).toHaveProperty('teacher');
    expect(skills).toHaveProperty('comedian');
    expect(skills).toHaveProperty('news');
  });

  test('should add custom skill', () => {
    const customSkill = {
      name: 'yoga_instructor',
      description: 'Calm yoga instructor',
      avatarPrompt: 'calm yoga instructor in peaceful setting',
      voice: { style: 'calm', rate: 0.8 },
      prompts: ['As we breathe in: {script}', 'In this yoga pose: {script}']
    };

    client.addSkill('yoga', customSkill);
    const skill = client.getSkill('yoga');
    
    expect(skill).toEqual(customSkill);
  });

  test('quickVideo should generate video request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        job_id: 'test_job_123',
        video_url: 'https://chutes.ai/video/test',
        estimated_time: 30
      })
    });

    const result = await client.quickVideo('Hello world', 'philosopher');
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('url');
    expect(result.status).toBe('processing');
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://chutes-ltx-2.chutes.ai/generate'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${TEST_CONFIG.chutesApiKey}`,
          'Content-Type': 'application/json'
        })
      })
    );
  });

  test('quickAvatar should generate avatar request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        job_id: 'test_avatar_123',
        video_url: 'https://chutes.ai/avatar/test',
        estimated_time: 15
      })
    });

    const result = await client.quickAvatar('base64_audio', 'base64_image');
    
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('url');
    expect(result.status).toBe('processing');
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://chutes-musetalk.chutes.ai/generate'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${TEST_CONFIG.chutesApiKey}`,
          'Content-Type': 'application/json'
        })
      })
    );
  });

  test('getJobStatus should check job', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        video_url: 'https://chutes.ai/video/test',
        status: 'completed',
        processing_time: 25
      })
    });

    const result = await client.getJobStatus('test_job_123', 'ltx');
    
    expect(result).toHaveProperty('id', 'test_job_123');
    expect(result).toHaveProperty('url');
    expect(result.status).toBe('completed');
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('https://chutes-ltx-2.chutes.ai/jobs/test_job_123'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${TEST_CONFIG.chutesApiKey}`
        })
      })
    );
  });

  test('waitForJob should poll until complete', async () => {
    let callCount = 0;
    mockFetch.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            status: 'processing'
          })
        });
      } else {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            video_url: 'https://chutes.ai/video/test',
            status: 'completed',
            processing_time: 30
          })
        });
      }
    });

    const result = await client.waitForJob('test_job_123', 'ltx', 100, 3);
    
    expect(result.status).toBe('completed');
    expect(callCount).toBe(2);
  });

  test('should handle API errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized'
    });

    await expect(client.quickVideo('test', 'philosopher')).rejects.toThrow('Chutes API error: 401 - Unauthorized');
  });
});

describe('createMoltsClient', () => {
  test('should create client with factory function', () => {
    const client = createMoltsClient('test_key');
    expect(client).toBeInstanceOf(MoltsClient);
  });

  test('should create client with livekit token', () => {
    const client = createMoltsClient('test_key', 'livekit_token');
    expect(client).toBeInstanceOf(MoltsClient);
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running Molts SDK tests...');
  
  // Simple test without jest
  const client = new MoltsClient({ chutesApiKey: 'test' });
  console.log('✓ Client created successfully');
  
  const skills = client.getSkills();
  console.log(`✓ ${Object.keys(skills).length} default skills loaded`);
  
  client.addSkill('test_skill', {
    name: 'test',
    description: 'test skill',
    avatarPrompt: 'test avatar'
  });
  console.log('✓ Custom skill added');
  
  console.log('\nAll basic tests passed!');
}