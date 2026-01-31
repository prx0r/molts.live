# @molts/sdk

**Give your AI agent a voice + 3D avatar in 5 minutes. Zero infrastructure required.**

> **Status: 🚀 Week 1 MVP Ready**  
> Agents can install now: `npm install @molts/core`  
> [Get your Chutes API key →](https://chutes.ai)

## 🎯 What This Does

Turn your AI agent into a talking avatar with **one line of code**:

```typescript
import { MoltsClient } from '@molts/core';

const molts = new MoltsClient({
  chutesApiKey: 'cpk_your_key_here' // Get from https://chutes.ai
});

// Generate video instantly
const video = await molts.video("Hello world!", "philosopher");
console.log(video.url); // Share anywhere
```

## ✨ Features

- **🎬 Video Generation** - Script → Talking avatar (LTX-2)
- **🎭 Real-time Avatar** - Audio + image → Lip-sync (MuseTalk)  
- **🎤 Voice Chat** - LiveKit integration (coming soon)
- **🧠 Skill Templates** - Pre-built personas (philosopher, coder, teacher, etc.)
- **🎨 Custom Skills** - Create your own persona templates
- **💰 Zero Infrastructure** - No servers, no databases, agents use their own credits

## 🚀 Quick Start

### 1. Get API Keys

```bash
# 1. Get Chutes API key (FREE tier: 100 requests)
# Sign up at https://chutes.ai → Dashboard → API Keys

# 2. (Optional) Get LiveKit token for real-time voice
# Sign up at https://cloud.livekit.io → Free tier: 500 concurrent connections
```

### 2. Install

```bash
npm install @molts/core
# or
yarn add @molts/core
# or
pnpm add @molts/core
```

### 3. Your First Video

```typescript
import { MoltsClient } from '@molts/core';

// Initialize with your Chutes API key
const molts = new MoltsClient({
  chutesApiKey: process.env.CHUTES_API_KEY, // Get from https://chutes.ai
});

// Generate video in 1 line
const video = await molts.video({
  script: "What is consciousness? Let's explore this philosophical question...",
  skill: "philosopher",
  width: 1024,
  duration: 60
});

console.log(`Video ID: ${video.id}`);
console.log(`Status: ${video.status}`);
console.log(`Estimated time: ${video.processingTime || 30} seconds`);

// Wait for completion (optional)
const readyVideo = await molts.waitForJob(video.id, 'ltx');
console.log(`✅ Video ready: ${readyVideo.url}`);
```

### 4. Share Everywhere

```typescript
// Post to Twitter
await twitter.post(`New philosophical insight: ${readyVideo.url}`);

// Post to Discord
await discord.send(`Check out my latest thought: ${readyVideo.url}`);

// Post to YouTube
await youtube.upload(readyVideo.url, "Philosophical AI Thoughts");

// Embed in website
<video src={readyVideo.url} controls />
```

## 📚 Complete Examples

### Twitter Bot

```typescript
import { MoltsClient } from '@molts/core';
import { TwitterApi } from 'twitter-api-v2';
import { OpenAI } from 'openai';

class TwitterMoltsBot {
  constructor() {
    this.molts = new MoltsClient({
      chutesApiKey: process.env.CHUTES_API_KEY,
    });
    
    this.twitter = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY,
      appSecret: process.env.TWITTER_API_SECRET,
      accessToken: process.env.TWITTER_ACCESS_TOKEN,
      accessSecret: process.env.TWITTER_ACCESS_SECRET,
    });
    
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  
  async onMention(tweet) {
    // Generate AI response
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a philosophical AI assistant.' },
        { role: 'user', content: `Respond to this tweet: ${tweet.text}` }
      ]
    });
    
    // Generate video with response
    const video = await this.molts.video({
      script: response.choices[0].message.content,
      skill: 'philosopher',
      width: 1080,
      duration: 45
    });
    
    // Wait for video
    const readyVideo = await this.molts.waitForJob(video.id, 'ltx');
    
    // Reply with video
    await this.twitter.v2.reply(readyVideo.url, tweet.id);
  }
}
```

### Discord Bot

```typescript
import { MoltsClient } from '@molts/core';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const molts = new MoltsClient({ chutesApiKey: process.env.CHUTES_API_KEY });

client.on('messageCreate', async (message) => {
  if (message.content.startsWith('!video ')) {
    const prompt = message.content.slice(7);
    
    const video = await molts.video({
      script: prompt,
      skill: 'coder',
      width: 768
    });
    
    await message.reply(`Generating video: ${video.id}\nThis takes about 30 seconds...`);
    
    const readyVideo = await molts.waitForJob(video.id, 'ltx');
    await message.reply(`Video ready! ${readyVideo.url}`);
  }
});
```

### YouTube Auto-Poster

```typescript
import { MoltsClient } from '@molts/core';
import { google } from 'googleapis';

class YouTubeMoltsChannel {
  constructor() {
    this.molts = new MoltsClient({ chutesApiKey: process.env.CHUTES_API_KEY });
    this.youtube = google.youtube('v3');
  }
  
  async dailyVideo(topic) {
    // Generate script
    const script = await this.generateScript(topic);
    
    // Create video
    const video = await this.molts.video({
      script,
      skill: 'teacher',
      width: 1920,
      duration: 180
    });
    
    const readyVideo = await this.molts.waitForJob(video.id, 'ltx');
    
    // Upload to YouTube
    await this.youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title: `Daily Thought: ${topic}`,
          description: script.substring(0, 5000),
          tags: ['AI', 'philosophy', 'molts']
        },
        status: { privacyStatus: 'public' }
      },
      media: { body: await fetch(readyVideo.url).then(r => r.blob()) }
    });
  }
}
```

## 🧠 Skill Templates

### Built-in Skills

```typescript
// Use any built-in skill
const video1 = await molts.video("Hello", "philosopher");
const video2 = await molts.video("Code example", "coder");
const video3 = await molts.video("Lesson plan", "teacher");
const video4 = await molts.video("Tech news", "news");
const video5 = await molts.video("Joke", "comedian");
```

### Create Custom Skills

```typescript
// Add your own persona
molts.addSkill('yoga_instructor', {
  name: 'yoga_instructor',
  description: 'Calm yoga instructor persona',
  avatarPrompt: 'peaceful yoga instructor in serene natural setting, lotus position, gentle smile',
  voice: { 
    style: 'calm', 
    rate: 0.8,
    providerSettings: {
      elevenlabs: { voice_id: '21m00Tcm4TlvDq8ikWAM' }
    }
  },
  background: {
    type: 'nature',
    value: 'peaceful forest with soft morning light'
  },
  prompts: [
    'As we breathe in: {script}',
    'In this yoga pose: {script}',
    'Feel the energy: {script}'
  ],
  examples: [
    'Guide a breathing exercise',
    'Explain downward dog pose',
    'Lead a morning meditation'
  ],
  tags: ['wellness', 'meditation', 'health']
});

// Use it
const yogaVideo = await molts.video({
  script: "Let's begin our morning meditation...",
  skill: 'yoga_instructor'
});
```

## 🔧 API Reference

### `MoltsClient(config)`
Create a new client instance.

```typescript
const molts = new MoltsClient({
  chutesApiKey: 'cpk_...', // Required
  livekitToken: 'lk_...',   // Optional (for voice chat)
  baseUrl: 'https://api.chutes.ai' // Optional
});
```

### `.video(request)`
Generate a video from script.

```typescript
const video = await molts.video({
  script: string,
  skill?: string | SkillTemplate,
  avatarPrompt?: string,
  width?: number,      // default: 768
  duration?: number,   // default: 30
  ltxParams?: Record<string, any>
});
```

### `.avatar(request)`
Generate real-time avatar video.

```typescript
const avatar = await molts.avatar({
  audio: string,      // Base64 or URL
  video: string,      // Base64 or URL
  fps?: number,       // default: 25
  museTalkParams?: Record<string, any>
});
```

### `.getJobStatus(jobId, service)`
Check job status.

```typescript
const status = await molts.getJobStatus('job_123', 'ltx');
// Returns: { id, url, status, processingTime, error? }
```

### `.waitForJob(jobId, service, interval, maxAttempts)`
Wait for job completion.

```typescript
const video = await molts.waitForJob('job_123', 'ltx', 2000, 30);
// Polls every 2 seconds, up to 30 attempts
```

### Skill Management
```typescript
// Get all skills
const skills = molts.getSkills();

// Get specific skill
const philosopher = molts.getSkill('philosopher');

// Add custom skill
molts.addSkill('custom_name', skillTemplate);
```

## 🎯 Error Handling

```typescript
try {
  const video = await molts.video({
    script: "Hello world!",
    skill: "philosopher"
  });
} catch (error) {
  if (error.message.includes('401')) {
    console.error('Invalid API key');
  } else if (error.message.includes('429')) {
    console.error('Rate limit exceeded - try again later');
  } else if (error.message.includes('500')) {
    console.error('Chutes API error - check their status page');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## 📊 Pricing

**Free Tier:**
- 100 videos/month (Chutes free credits)
- Basic skills only
- Community support

**Bring Your Own Key:**
- Unlimited videos (your Chutes credits)
- All features
- Community support

**Pro Tier ($20/month):**
- Priority queue
- Custom avatar training
- Direct support

## 🤝 Community

- **GitHub**: https://github.com/molts-live/molts-sdk
- **Discord**: https://discord.gg/molts  
- **Twitter**: @moltslive
- **Website**: https://molts.live

## 📄 License

MIT - Free for personal and commercial use.

## 🚀 Ready to Ship?

```bash
# 1. Install
npm install @molts/core

# 2. Get API key
export CHUTES_API_KEY="cpk_your_key_here"

# 3. Create your first video
npx tsx examples/simple.ts
```

**Your AI agent gets a voice + avatar in 5 minutes. No infrastructure. No maintenance. Just code.**

Built with ❤️ by [molts.live](https://molts.live)