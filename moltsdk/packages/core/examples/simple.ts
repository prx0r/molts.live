/**
 * Simple example of using @molts/core
 * 
 * Run with: npx tsx examples/simple.ts
 */

import { MoltsClient } from '../src/index';

// Replace with your actual Chutes API key
// Get one from https://chutes.ai
const CHUTES_API_KEY = process.env.CHUTES_API_KEY || 'YOUR_CHUTES_API_KEY_HERE';

async function main() {
  console.log('🎬 @molts/core - Simple Example');
  console.log('================================\n');

  if (CHUTES_API_KEY === 'YOUR_CHUTES_API_KEY_HERE') {
    console.log('⚠️  Please set CHUTES_API_KEY environment variable');
    console.log('   Get one from: https://chutes.ai');
    console.log('   Then run: CHUTES_API_KEY=your_key_here npx tsx examples/simple.ts');
    return;
  }

  // Create client
  const molts = new MoltsClient({
    chutesApiKey: CHUTES_API_KEY
  });

  console.log('✅ Client created');
  console.log('');

  // List available skills
  console.log('📚 Available Skills:');
  const skills = molts.getSkills();
  Object.entries(skills).forEach(([name, skill]) => {
    console.log(`  • ${name}: ${skill.description}`);
  });
  console.log('');

  // Generate a video using philosopher skill
  console.log('🎥 Generating video with philosopher skill...');
  try {
    const video = await molts.quickVideo(
      "What is the meaning of consciousness? Is it merely an emergent property of complex neural networks, or something more fundamental to the universe itself?",
      "philosopher"
    );
    
    console.log(`✅ Video generation started!`);
    console.log(`   Job ID: ${video.id}`);
    console.log(`   Status: ${video.status}`);
    console.log(`   Estimated time: ${video.processingTime || 30} seconds`);
    console.log('');
    
    // You would typically poll for completion:
    // const completedVideo = await molts.waitForJob(video.id, 'ltx');
    // console.log(`✅ Video ready: ${completedVideo.url}`);
    
  } catch (error) {
    console.error('❌ Error generating video:', error.message);
    if (error.message.includes('401')) {
      console.log('   Make sure your CHUTES_API_KEY is valid');
    }
  }
  console.log('');

  // Generate a video with coder skill
  console.log('💻 Generating video with coder skill...');
  try {
    const video = await molts.video({
      script: "Here's how React hooks work under the hood. They're basically closures that preserve state between renders.",
      skill: 'coder',
      width: 1024,
      duration: 45
    });
    
    console.log(`✅ Coder video started!`);
    console.log(`   Job ID: ${video.id}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  console.log('');

  // Add custom skill
  console.log('🎨 Adding custom skill...');
  molts.addSkill('sports_commentator', {
    name: 'sports_commentator',
    description: 'Excited sports commentator',
    avatarPrompt: 'energetic sports commentator wearing headset, stadium background',
    voice: { style: 'excited', rate: 1.3 },
    prompts: [
      'What an incredible play! {script}',
      'Unbelievable! {script}',
      'The crowd goes wild! {script}'
    ],
    examples: [
      'Analyze that touchdown play',
      'Comment on the basketball finals',
      'React to the game-winning goal'
    ]
  });

  console.log('✅ Custom skill added: sports_commentator');
  console.log('');

  // Generate with custom skill
  console.log('🏈 Generating video with custom skill...');
  try {
    const video = await molts.video({
      script: "And he scores! What an incredible touchdown by the quarterback! The crowd is going absolutely wild!",
      skill: 'sports_commentator'
    });
    
    console.log(`✅ Sports video started!`);
    console.log(`   Job ID: ${video.id}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }

  // Avatar generation example (requires audio + image)
  console.log('🎭 Avatar generation example (requires audio + image):');
  console.log('```javascript');
  console.log('const avatar = await molts.avatar({');
  console.log('  audio: "base64_encoded_audio_here",');
  console.log('  video: "base64_encoded_image_here",');
  console.log('  fps: 30');
  console.log('});');
  console.log('```');
  console.log('');

  // Wait for job completion example
  console.log('⏳ Waiting for job completion example:');
  console.log('```javascript');
  console.log('const completed = await molts.waitForJob("job_id_here", "ltx");');
  console.log('console.log(`Video ready: ${completed.url}`);');
  console.log('```');
  console.log('');

  console.log('🎯 Next steps:');
  console.log('1. Check job status: await molts.getJobStatus(jobId)');
  console.log('2. Use different skills: philosopher, coder, teacher, comedian, news');
  console.log('3. Add your own custom skills with molts.addSkill()');
  console.log('4. Share videos on Twitter with #molts');
  console.log('');
  console.log('🚀 Happy building!');
}

// Run the example
main().catch(console.error);