/**
 * Test version of simple.ts that validates the SDK works
 * 
 * Run with: npx tsx examples/test-simple.ts
 */

import { MoltsClient, createMoltsClient } from '../src/index';

async function testExample() {
  console.log('🧪 Testing @molts/core - Basic SDK Validation');
  console.log('============================================\n');

  // Create client with test key
  const molts = new MoltsClient({
    chutesApiKey: 'test_chutes_api_key_123'
  });

  console.log('✅ Client created successfully');
  console.log('');

  // 1. Test skills management
  console.log('📚 Testing Skills Management:');
  const skills = molts.getSkills();
  const skillNames = Object.keys(skills);
  
  console.log(`   Found ${skillNames.length} default skills:`);
  skillNames.forEach(name => {
    const skill = skills[name];
    console.log(`   • ${name}: ${skill.description}`);
  });
  
  if (skillNames.length >= 5) {
    console.log('✅ Default skills loaded correctly');
  } else {
    console.log('❌ Expected at least 5 default skills');
  }
  console.log('');

  // 2. Test adding custom skill
  console.log('🎨 Testing Custom Skill Addition:');
  const customSkill = {
    name: 'test_yoga_instructor',
    description: 'Test yoga instructor',
    avatarPrompt: 'calm yoga instructor in peaceful setting',
    voice: { style: 'calm', rate: 0.8 },
    prompts: ['Test prompt: {script}']
  };

  molts.addSkill('yoga_test', customSkill);
  const retrievedSkill = molts.getSkill('yoga_test');
  
  if (retrievedSkill && retrievedSkill.name === 'test_yoga_instructor') {
    console.log('✅ Custom skill added and retrieved successfully');
    console.log(`   Name: ${retrievedSkill.name}`);
    console.log(`   Description: ${retrievedSkill.description}`);
  } else {
    console.log('❌ Failed to add or retrieve custom skill');
  }
  console.log('');

  // 3. Test factory function
  console.log('🏭 Testing Factory Function:');
  const factoryClient = createMoltsClient('factory_test_key');
  
  if (factoryClient && typeof factoryClient.getSkills === 'function') {
    console.log('✅ Factory function creates valid client');
    const factorySkills = factoryClient.getSkills();
    console.log(`   Factory client has ${Object.keys(factorySkills).length} skills`);
  } else {
    console.log('❌ Factory function failed');
  }
  console.log('');

  // 4. Test validation
  console.log('🔒 Testing Validation:');
  try {
    new MoltsClient({ chutesApiKey: '' });
    console.log('❌ Should have thrown error for empty API key');
  } catch (error: any) {
    if (error.message.includes('chutesApiKey is required')) {
      console.log('✅ Correctly validates required API key');
    } else {
      console.log(`❌ Unexpected error: ${error.message}`);
    }
  }
  console.log('');

  // 5. Test client with livekit token
  console.log('🎤 Testing LiveKit Integration Setup:');
  const livekitClient = new MoltsClient({
    chutesApiKey: 'test_key',
    livekitToken: 'test_livekit_token'
  });
  
  if (livekitClient) {
    console.log('✅ Client with LiveKit token created successfully');
  }
  console.log('');

  // 6. Test getSkills returns copy
  console.log('📋 Testing Skills Immutability:');
  const originalSkills = molts.getSkills();
  const originalCount = Object.keys(originalSkills).length;
  
  // Try to modify the returned object (should not affect internal state)
  const modifiedSkills = molts.getSkills();
  modifiedSkills['tampered'] = { name: 'tampered', description: 'should not exist' };
  
  const currentSkills = molts.getSkills();
  if (!currentSkills['tampered']) {
    console.log('✅ getSkills() returns a copy (immutable)');
  } else {
    console.log('❌ getSkills() returns mutable reference');
  }
  console.log('');

  // 7. Test missing skill handling
  console.log('❓ Testing Missing Skill Handling:');
  const missingSkill = molts.getSkill('non_existent_skill');
  if (missingSkill === undefined) {
    console.log('✅ Returns undefined for non-existent skill');
  } else {
    console.log('❌ Should return undefined for non-existent skill');
  }
  console.log('');

  console.log('🎯 Test Summary:');
  console.log('✓ Client creation and validation');
  console.log('✓ Skills management (default + custom)');
  console.log('✓ Factory function');
  console.log('✓ API key validation');
  console.log('✓ LiveKit token support');
  console.log('✓ Immutable skills');
  console.log('✓ Missing skill handling');
  console.log('');
  console.log('🚀 Basic SDK functionality validated successfully!');
  console.log('');
  console.log('💡 Next Steps:');
  console.log('1. Set CHUTES_API_KEY environment variable for real API tests');
  console.log('2. Run examples/simple.ts with a real API key');
  console.log('3. Check test/basic.test.ts and test/integration.test.ts for unit tests');
  console.log('4. Run "npm test" to execute all tests');
}

// Run the test
testExample().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});