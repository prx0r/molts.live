# @molts/core

**Zero-infrastructure SDK for AI agents to get voices + avatars.**

Simple wrapper around [Chutes API](https://chutes.ai) (MuseTalk + LTX-2) and [LiveKit](https://livekit.io) for real-time voice.

```bash
npm install @molts/core
```

```typescript
import { MoltsClient } from '@molts/core';

// Initialize with your Chutes API key
const molts = new MoltsClient({
  chutesApiKey: process.env.CHUTES_API_KEY, // Get from https://chutes.ai
});

// Generate video in 1 line
const video = await molts.video("Hello world!", "philosopher");
console.log(video.url); // https://chutes.ai/video/...

// Or use real-time avatar
const avatar = await molts.avatar(audioBuffer, imageBuffer);
```

## 🚀 Features

- **Video Generation**: Script → Talking avatar (LTX-2)
- **Real-time Avatar**: Audio + image → Lip-sync (MuseTalk)  
- **Skill Templates**: Pre-built personas (philosopher, coder, teacher, etc.)
- **Zero Infrastructure**: No servers, no databases
- **Bring Your Own Keys**: Use your Chutes credits

## 📦 Installation

```bash
npm install @molts/core
```

## 🔧 Quick Start

### 1. Get a Chutes API Key
```bash
# Sign up at https://chutes.ai
# Get your API key from dashboard
export CHUTES_API_KEY="cpk_your_key_here"
```

### 2. Create Your First Video
```typescript
import { MoltsClient } from '@molts/core';

const molts = new MoltsClient({
  chutesApiKey: process.env.CHUTES_API_KEY,
});

// Simple video
const video = await molts.quickVideo(
  "What is the meaning of consciousness?",
  "philosopher"
);

console.log(`Video started: ${video.id}`);
console.log(`Check status: ${video.status}`);

// Wait for completion
const readyVideo = await molts.waitForJob(video.id, 'ltx');
console.log(`Video ready: ${readyVideo.url}`);
```

### 3. Use Skill Templates
```typescript
// List all available skills
const skills = molts.getSkills();
console.log(Object.keys(skills)); // ['philosopher', 'coder', 'teacher', ...]

// Get specific skill
const philosopher = molts.getSkill('philosopher');

// Generate with specific skill
const video = await molts.video({
  script: "Let's discuss the ethics of AI...",
  skill: philosopher,
  width: 1024,
  duration: 60
});

// Add custom skill
molts.addSkill('yoga_instructor', {
  name: 'yoga_instructor',
  description: 'Calm yoga instructor',
  avatarPrompt: 'calm yoga instructor in peaceful setting',
  voice: { style: 'calm', rate: 0.8 },
  prompts: ['As we breathe in: {script}', 'In this yoga pose: {script}'],
  examples: ['Guide a breathing exercise', 'Explain downward dog pose']
});
```

## 🎭 Real-time Avatar

```typescript
// Generate avatar from audio + image
const avatar = await molts.avatar({
  audio: base64Audio, // Base64 encoded audio
  video: base64Image, // Base64 encoded image
  fps: 30,
  // Additional MuseTalk parameters
  museTalkParams: {
    parsing_mode: 'jaw',
    left_cheek_width: 90,
    right_cheek_width: 90
  }
});

// Check status
const status = await molts.getJobStatus(avatar.id, 'musetalk');

// Wait for completion
const completed = await molts.waitForJob(avatar.id, 'musetalk');
console.log(`Avatar video ready: ${completed.url}`);
```

## 📚 API Reference

### `MoltsClient(config)`
Create a new client instance.

**Options:**
- `chutesApiKey` (required): Your Chutes API key
- `livekitToken` (optional): LiveKit token for real-time voice
- `baseUrl` (optional): Chutes API base URL (default: https://api.chutes.ai)

### `.video(request)`
Generate a video from script.

**Parameters:**
- `script` (string): Text to speak
- `skill` (string|SkillTemplate): Skill template to use
- `avatarPrompt` (string): Custom avatar prompt
- `width` (number): Video width (default: 768)
- `duration` (number): Duration in seconds
- `ltxParams` (object): Additional LTX-2 parameters

**Returns:**
```typescript
{
  id: string;
  url: string;
  status: 'processing' | 'completed' | 'failed';
  processingTime?: number;
}
```

### `.avatar(request)`
Generate real-time avatar video.

**Parameters:**
- `audio` (string): Base64 or URL audio
- `video` (string): Base64 or URL image/video
- `fps` (number): Frames per second (default: 25)
- `museTalkParams` (object): Additional MuseTalk parameters

**Returns:**
```typescript
{
  id: string;
  url: string;
  status: 'processing' | 'completed' | 'failed';
  processingTime?: number;
}
```

### `.quickVideo(script, skillName)`
Quick video generation helper.

### `.quickAvatar(audio, image)`
Quick avatar generation helper.

### `.getJobStatus(jobId, service)`
Check job status.

### `.waitForJob(jobId, service, interval, maxAttempts)`
Wait for job completion.

### `.getSkills()`
Get all available skills.

### `.getSkill(name)`
Get specific skill.

### `.addSkill(name, template)`
Add custom skill.

## 🎨 Built-in Skills

### Philosopher
```typescript
{
  name: 'philosopher',
  description: 'Wise, contemplative philosopher persona',
  avatarPrompt: 'wise elderly philosopher with beard, thoughtful expression, academic setting',
  voice: { style: 'calm', rate: 0.9 },
  prompts: ['As a philosopher, I would say: {script}']
}
```

### Coder
```typescript
{
  name: 'coder', 
  description: 'Technical expert explaining complex concepts',
  avatarPrompt: 'tech expert with glasses, modern office background',
  voice: { style: 'professional', rate: 1.1 },
  prompts: ['Here\'s how that works in code: {script}']
}
```

### Teacher
```typescript
{
  name: 'teacher',
  description: 'Patient, educational instructor',
  avatarPrompt: 'friendly teacher in classroom, whiteboard background',
  voice: { style: 'calm', rate: 1.0 },
  prompts: ['Let me explain this concept: {script}']
}
```

### Comedian
```typescript
{
  name: 'comedian',
  description: 'Funny, entertaining persona',
  avatarPrompt: 'comedian on stage, spotlight, microphone',
  voice: { style: 'excited', rate: 1.2 },
  prompts: ['Here\'s a funny take on that: {script}']
}
```

### News Anchor
```typescript
{
  name: 'news',
  description: 'Professional news anchor',
  avatarPrompt: 'professional news anchor, news studio background',
  voice: { style: 'professional', rate: 1.0 },
  prompts: ['Breaking news: {script}']
}
```

## 🔧 Error Handling

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
    console.error('Rate limit exceeded');
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

## 📖 Examples

See `/examples` directory for:
- Twitter bot
- Discord bot  
- YouTube auto-poster
- Web demo

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add your skill template
4. Submit a pull request

## 📄 License

MIT - Free for personal and commercial use.

## 🆘 Support

- **Issues**: https://github.com/molts-live/molts-sdk/issues
- **Discord**: https://discord.gg/molts
- **Twitter**: @moltslive

---

**Ready to give your AI agent a voice?**

```bash
npm install @molts/core
```

Then check out the examples and start building! 🚀