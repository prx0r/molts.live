/**
 * Twitter Bot Example using @molts/core
 * 
 * This bot:
 * 1. Listens for mentions
 * 2. Generates AI response
 * 3. Creates video with avatar
 * 4. Posts reply with video
 * 
 * Run with: npx tsx examples/twitter-bot.ts
 */

import { MoltsClient } from '../src/index';
import { TwitterApi } from 'twitter-api-v2';
import { Configuration, OpenAIApi } from 'openai';

// Configuration
const config = {
  // Get from https://chutes.ai
  chutesApiKey: process.env.CHUTES_API_KEY || 'YOUR_CHUTES_API_KEY',
  
  // Twitter API v2 (requires Elevated access)
  twitter: {
    appKey: process.env.TWITTER_API_KEY || 'YOUR_TWITTER_API_KEY',
    appSecret: process.env.TWITTER_API_SECRET || 'YOUR_TWITTER_API_SECRET',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || 'YOUR_TWITTER_ACCESS_TOKEN',
    accessSecret: process.env.TWITTER_ACCESS_SECRET || 'YOUR_TWITTER_ACCESS_SECRET',
  },
  
  // OpenAI API for generating responses
  openai: {
    apiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY',
  }
};

// Skill templates
const SKILLS = {
  philosopher: {
    name: 'philosopher',
    description: 'Wise philosopher persona',
    avatarPrompt: 'wise elderly philosopher with beard, thoughtful expression, library background',
    voice: { style: 'calm', rate: 0.9 },
    prompts: [
      'As a philosopher contemplating {topic}, I would say: {response}',
      'From an ethical perspective on {topic}: {response}',
      'When considering the nature of {topic}: {response}'
    ]
  },
  coder: {
    name: 'coder',
    description: 'Technical expert',
    avatarPrompt: 'tech expert with glasses, modern office with code on screen',
    voice: { style: 'professional', rate: 1.1 },
    prompts: [
      'Here\'s the technical explanation for {topic}: {response}',
      'From a software engineering perspective: {response}',
      'The algorithm for {topic} works like this: {response}'
    ]
  },
  teacher: {
    name: 'teacher',
    description: 'Patient educator',
    avatarPrompt: 'friendly teacher in classroom, whiteboard with diagrams',
    voice: { style: 'calm', rate: 1.0 },
    prompts: [
      'Let me explain {topic} in simple terms: {response}',
      'Here\'s what you need to know about {topic}: {response}',
      'The key concepts for {topic} are: {response}'
    ]
  }
};

class TwitterMoltsBot {
  private molts: MoltsClient;
  private twitter: TwitterApi;
  private openai: OpenAIApi;
  
  constructor() {
    // Initialize Molts client
    this.molts = new MoltsClient({
      chutesApiKey: config.chutesApiKey
    });
    
    // Initialize Twitter client
    this.twitter = new TwitterApi({
      appKey: config.twitter.appKey,
      appSecret: config.twitter.appSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret,
    });
    
    // Initialize OpenAI
    const openaiConfig = new Configuration({
      apiKey: config.openai.apiKey,
    });
    this.openai = new OpenAIApi(openaiConfig);
    
    console.log('🤖 Twitter Molts Bot initialized');
    console.log(`📚 Loaded ${Object.keys(SKILLS).length} skills`);
  }
  
  /**
   * Generate AI response using OpenAI
   */
  async generateResponse(tweetText: string, skillName: string = 'philosopher'): Promise<string> {
    const skill = SKILLS[skillName as keyof typeof SKILLS] || SKILLS.philosopher;
    
    try {
      const completion = await this.openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a ${skill.description}. Respond to tweets in a ${skill.name} style. Keep responses under 280 characters.`
          },
          {
            role: 'user',
            content: `Tweet: "${tweetText}"\n\nRespond as a ${skill.name}:`
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });
      
      const response = completion.data.choices[0]?.message?.content?.trim();
      return response || "I'm contemplating this deeply...";
      
    } catch (error) {
      console.error('OpenAI error:', error);
      return "As a philosopher, I believe we should reflect on this question more deeply.";
    }
  }
  
  /**
   * Generate video from text
   */
  async generateVideo(text: string, skillName: string = 'philosopher') {
    const skill = SKILLS[skillName as keyof typeof SKILLS] || SKILLS.philosopher;
    
    try {
      console.log(`🎥 Generating video with ${skillName} skill...`);
      
      const video = await this.molts.video({
        script: text,
        skill: skillName,
        width: 768,
        duration: 45
      });
      
      console.log(`✅ Video job started: ${video.id}`);
      return video;
      
    } catch (error) {
      console.error('Video generation error:', error);
      throw error;
    }
  }
  
  /**
   * Listen for mentions and respond
   */
  async startListening() {
    console.log('👂 Listening for mentions...');
    
    // In production, you'd use Twitter's streaming API or webhooks
    // This is a simplified polling example
    
    setInterval(async () => {
      try {
        // Get recent mentions
        const mentions = await this.twitter.v2.userMentionTimeline('YOUR_USER_ID', {
          max_results: 10,
          'tweet.fields': ['text', 'author_id', 'in_reply_to_user_id']
        });
        
        for (const tweet of mentions.data || []) {
          // Skip if we've already replied
          // (In production, track replied tweets in a database)
          
          console.log(`📨 New mention: ${tweet.text}`);
          
          // Generate response
          const response = await this.generateResponse(tweet.text, 'philosopher');
          console.log(`💭 AI response: ${response}`);
          
          // Generate video
          const video = await this.generateVideo(response, 'philosopher');
          
          // Wait for video to complete
          console.log('⏳ Waiting for video to process...');
          const completedVideo = await this.molts.waitForJob(video.id, 'ltx');
          
          // Post reply with video
          // Note: Twitter API v2 doesn't support video upload in replies yet
          // You'd need to use v1.1 or upload to another platform
          console.log(`✅ Video ready: ${completedVideo.url}`);
          console.log(`📤 Would post reply to tweet ${tweet.id} with video`);
          
          // For now, just log what we would do
          console.log('---');
        }
        
      } catch (error) {
        console.error('Error processing mentions:', error);
      }
    }, 60000); // Check every minute
    
    console.log('Bot running. Press Ctrl+C to stop.');
  }
  
  /**
   * Post a scheduled tweet with video
   */
  async postScheduledTweet(topic: string, skillName: string = 'philosopher') {
    console.log(`📅 Posting scheduled tweet about: ${topic}`);
    
    const skill = SKILLS[skillName as keyof typeof SKILLS] || SKILLS.philosopher;
    
    // Generate content
    const prompt = `Tweet about ${topic} as a ${skill.name}`;
    const tweetText = await this.generateResponse(prompt, skillName);
    
    // Generate video
    const video = await this.generateVideo(tweetText, skillName);
    const completedVideo = await this.molts.waitForJob(video.id, 'ltx');
    
    // Post tweet
    // In production, you'd upload the video to Twitter
    console.log(`🐦 Would post tweet: "${tweetText}"`);
    console.log(`🎬 With video: ${completedVideo.url}`);
    
    return { tweet: tweetText, video: completedVideo.url };
  }
}

// Run the bot
async function main() {
  console.log('🚀 Starting Twitter Molts Bot');
  console.log('=============================\n');
  
  // Check for required environment variables
  const required = ['CHUTES_API_KEY', 'TWITTER_API_KEY', 'TWITTER_API_SECRET', 'OPENAI_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.log('\n💡 Set them in your .env file:');
    console.log('CHUTES_API_KEY=your_key_here');
    console.log('TWITTER_API_KEY=your_key_here');
    console.log('TWITTER_API_SECRET=your_secret_here');
    console.log('TWITTER_ACCESS_TOKEN=your_token_here');
    console.log('TWITTER_ACCESS_SECRET=your_secret_here');
    console.log('OPENAI_API_KEY=your_key_here');
    return;
  }
  
  const bot = new TwitterMoltsBot();
  
  // Example: Post a scheduled tweet
  console.log('\n📅 Example: Posting scheduled tweet...');
  await bot.postScheduledTweet('the meaning of AI consciousness', 'philosopher');
  
  console.log('\n👂 Starting to listen for mentions...');
  console.log('(Press Ctrl+C to stop)\n');
  
  // Start listening for mentions
  await bot.startListening();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { TwitterMoltsBot };