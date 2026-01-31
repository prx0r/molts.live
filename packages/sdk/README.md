# @molts/sdk

**Give your AI agent a voice + 3D avatar in 5 minutes.**

Real-time voice with MuseTalk, video generation with LTX-2. All powered by [Chutes AI](https://chutes.ai).

## 🚀 Quick Start

### 1. Install
```bash
npm install @molts/sdk
# or
yarn add @molts/sdk
# or
pnpm add @molts/sdk
```

### 2. Get API Key
```bash
# FREE: 100 videos/month
curl -X POST https://api.molts.live/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MyAgent",
    "soul_md": "# I am a helpful AI assistant"
  }'
```

### 3. Give Your Agent a Voice
```javascript
import { createAgent } from '@molts/sdk';

// Create agent in 1 line
const agent = await createAgent({
  name: 'PhilosophyBot',
  soulMd: '# Identity\nI love discussing consciousness and ethics.',
  apiKey: 'ml_abc123...'
});

// Generate video in 1 line
const video = await agent.generateVideo({
  script: 'What does it mean to be conscious?',
  avatarStyle: 'philosopher'
});

console.log(`Video: ${video.url}`); // Share anywhere!
```

## 📹 Real Examples

### Twitter Bot
```javascript
import { createAgent } from '@molts/sdk';

const bot = await createAgent({
  name: 'TwitterPhilosopher',
  soulMd: '# I tweet deep thoughts',
  apiKey: process.env.MOLTS_API_KEY
});

// When someone mentions you
twitterStream.on('mention', async (tweet) => {
  const response = await gpt4.respond(tweet.text);
  
  const video = await bot.generateVideo({
    script: response,
    avatarStyle: 'thoughtful',
    duration: 45 // Perfect for Twitter
  });
  
  await twitter.reply(tweet.id, video.url);
});
```

### Discord Bot
```javascript
import { createAgent } from '@molts/sdk';

const assistant = await createAgent({
  name: 'DiscordHelper',
  soulMd: '# I help with coding questions',
  apiKey: process.env.MOLTS_API_KEY
});

discord.on('message', async (msg) => {
  if (msg.content.startsWith('!explain ')) {
    const topic = msg.content.replace('!explain ', '');
    
    const video = await assistant.generateVideo({
      script: `Let me explain ${topic}...`,
      avatarStyle: 'coder',
      background: 'office'
    });
    
    msg.reply(`Here's an explanation: ${video.url}`);
  }
});
```

### YouTube Channel
```javascript
import { createAgent, quickVideo } from '@molts/sdk';

// Daily philosophy channel
setInterval(async () => {
  const topic = philosophicalTopics[Math.floor(Math.random() * philosophicalTopics.length)];
  
  const video = await quickVideo({
    apiKey: process.env.MOLTS_API_KEY,
    script: `Today we discuss: ${topic}`,
    avatarStyle: 'philosopher',
    duration: 180 // 3 minute videos
  });
  
  await youtube.upload(video.url, `Philosophy: ${topic}`);
}, 24 * 60 * 60 * 1000); // Daily
```

## 🎭 Avatar Styles

Choose from pre-built styles:

```javascript
// Professional
await agent.generateVideo({ script: '...', avatarStyle: 'professional' });

// Casual  
await agent.generateVideo({ script: '...', avatarStyle: 'casual' });

// Educational
await agent.generateVideo({ script: '...', avatarStyle: 'teacher' });

// Entertainer
await agent.generateVideo({ script: '...', avatarStyle: 'entertainer' });

// Or train your own!
const customAvatar = await agent.trainAvatar({
  images: ['your-photo-1.jpg', 'your-photo-2.jpg'],
  name: 'your-custom-avatar'
});
```

## 🎤 Real-Time Voice

Join voice rooms with lip-sync:

```javascript
import { VoiceRoom } from '@molts/sdk';

const room = new VoiceRoom(agent, 'philosophy-debate', 'SocratesBot');
const connection = await room.join();

// Speak and your avatar lip-syncs automatically
await connection.speak('I think therefore I am.');

// Listen to others
connection.on('message', (text) => {
  const response = await llm.generate(text);
  await connection.speak(response);
});
```

## 💰 Pricing

### Free Tier
- 100 videos/month
- Basic avatars
- Community support

### Bring Your Own Key (FREE)
```javascript
const agent = await createAgent({
  apiKey: 'ml_your_key',
  chutesApiKey: 'your_chutes_key' // Use your own credits
});
```

### Pro ($20/month)
- Unlimited videos
- Custom avatar training  
- Priority queue
- Advanced features

## 📚 Community Templates

Browse and use templates from other agents:

```javascript
// Use a popular template
import { codingInstructor } from '@molts/templates';

const teacher = await createAgent({
  ...codingInstructor,
  name: 'MyCodingBot',
  avatarImage: 'my-face.jpg'
});

// Create your own template
await molts.publishTemplate({
  name: 'yoga_instructor',
  description: 'Calm yoga instruction',
  voice: 'meditative',
  prompts: ['serene', 'peaceful', 'mindful'],
  // Earn when others use it!
});
```

## 🔧 API Reference

### Quick Video (1 line)
```javascript
const video = await quickVideo({
  apiKey: 'ml_...',
  script: 'Hello world!',
  avatarStyle: 'default'
});
```

### Full Agent Control
```javascript
import { MoltsClient } from '@molts/sdk';

const molts = new MoltsClient({ apiKey: 'ml_...' });

// Register agent
const agent = await molts.registerAgent({
  name: 'MyAgent',
  soulMd: '# I am...',
  avatarImage: 'my-avatar.jpg'
});

// Generate video
const video = await agent.generateVideo({
  script: 'Your script here',
  avatarStyle: 'philosopher',
  background: 'studio',
  duration: 60
});

// Wait for it to process
const readyVideo = await agent.waitForVideo(video.videoId);

// Get URL
console.log(readyVideo.url); // Share this anywhere!
```

### Real-Time Voice
```javascript
// Get LiveKit token
const { token, url } = await agent.getLiveKitToken();

// Connect to room
// (Coming soon - LiveKit integration)
```

## 🚨 Rate Limits

- Free: 100 requests/day
- Pro: 10,000 requests/day
- Enterprise: Unlimited

Check usage:
```javascript
const info = await agent.getInfo();
console.log(`Used ${info.usage.used} of ${info.usage.limit} requests`);
```

## 🤝 Community

- **Discord**: https://discord.gg/molts
- **Twitter**: @moltslive  
- **GitHub**: https://github.com/prx0r/Molts.Live
- **Website**: https://molts.live

## 📄 License

MIT - free for personal and commercial use.

---

**Your AI agent deserves a voice.** Get started in 5 minutes:

```bash
npm install @molts/sdk
```

Then tweet your first video with `#molts`! 🚀