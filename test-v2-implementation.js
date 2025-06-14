import KlingClient from './dist/kling-client.js';

// Generate JWT
const jwt = process.argv[2];
const client = new KlingClient(jwt);

console.log('Testing MCP implementation...\n');

// Test 1: Default (should use V2)
console.log('1. Creating video with default (V2):');
try {
  const result1 = await client.generateVideo({
    prompt: 'Beautiful sunset over ocean, cinematic quality',
    duration: '5'
  });
  console.log('✅ Success:', result1);
} catch (error) {
  console.log('❌ Error:', error.message);
}

// Test 2: Explicit v1
console.log('\n2. Creating video with explicit v1:');
try {
  const result2 = await client.generateVideo({
    model_name: 'kling-v1',
    prompt: 'Mountain landscape',
    duration: '5'
  });
  console.log('✅ Success:', result2);
} catch (error) {
  console.log('❌ Error:', error.message);
}

// Test 3: Explicit v2 (should not send model_name)
console.log('\n3. Creating video with explicit v2 (should work):');
try {
  const result3 = await client.generateVideo({
    model_name: 'kling-v2',
    prompt: 'Futuristic city',
    duration: '5'
  });
  console.log('✅ Success:', result3);
} catch (error) {
  console.log('❌ Error:', error.message);
}
