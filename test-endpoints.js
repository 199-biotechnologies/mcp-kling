#!/usr/bin/env node

// Test script for Kling API endpoints with correct formats
import { SignJWT } from 'jose';

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY || 'AnG8dFHyyyJ33trBEGKTmAKgfR4EFQJ8';
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY || '9YGL3FCdnmrbCfnyDKPD3HCnteRaTLDC';

async function generateJWT(accessKey, secretKey) {
  const secret = new TextEncoder().encode(secretKey);
  const currentTime = Math.floor(Date.now() / 1000);
  
  const jwt = await new SignJWT({ 
    iss: accessKey,
    exp: currentTime + 1800,
    nbf: currentTime - 5,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(secret);
  
  return jwt;
}

// Example API calls with corrected formats

console.log('=== Kling API Test Examples ===\n');

// 1. High-quality text-to-video
console.log('1. Text-to-Video (High Quality):');
console.log(`curl -X POST 'https://api-singapore.klingai.com/v1/videos/text2video' \\
  -H "Authorization: Bearer YOUR_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_name": "kling-v2",
    "prompt": "A cinematic shot of a futuristic city at night, neon lights, flying cars, cyberpunk style, 8K quality",
    "aspect_ratio": "16:9",
    "duration": "10",
    "cfg_scale": 0.8,
    "mode": "professional"
  }'`);

// 2. Lip-sync with proper nested structure
console.log('\n\n2. Lip-Sync (Corrected Format):');
console.log(`curl -X POST 'https://api-singapore.klingai.com/v1/videos/lip-sync' \\
  -H "Authorization: Bearer YOUR_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": {
      "video_id": "YOUR_VIDEO_ID",
      "mode": "text2video",
      "text": "Hello world, this is a test of the lip sync feature",
      "voice_id": "female-gentle",
      "voice_language": "en",
      "voice_speed": 1.0
    }
  }'`);

// 3. Video effects
console.log('\n\n3. Video Effects (Bloom Effect):');
console.log(`curl -X POST 'https://api-singapore.klingai.com/v1/videos/effects' \\
  -H "Authorization: Bearer YOUR_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "input": {
      "image_urls": ["https://example.com/portrait.jpg"],
      "effect_scene": "bloombloom",
      "duration": "5",
      "model_name": "kling-v2"
    }
  }'`);

// 4. Image-to-video with high quality
console.log('\n\n4. Image-to-Video (High Quality):');
console.log(`curl -X POST 'https://api-singapore.klingai.com/v1/videos/image2video' \\
  -H "Authorization: Bearer YOUR_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_name": "kling-v2",
    "image_url": "https://example.com/landscape.jpg",
    "prompt": "Camera slowly pans across the landscape revealing hidden details",
    "duration": "10",
    "cfg_scale": 0.8,
    "mode": "professional"
  }'`);

// 5. Virtual try-on
console.log('\n\n5. Virtual Try-On:');
console.log(`curl -X POST 'https://api-singapore.klingai.com/v1/virtual-try-on' \\
  -H "Authorization: Bearer YOUR_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{
    "person_image_url": "https://example.com/model.jpg",
    "cloth_image_urls": ["https://example.com/dress.jpg"],
    "model_name": "kolors-virtual-try-on-v1.5"
  }'`);

console.log('\n\n=== Quality Settings Guide ===');
console.log('- Use model_name: "kling-v2" for latest/best quality');
console.log('- Set mode: "professional" for highest quality');
console.log('- Use cfg_scale: 0.7-0.9 for better adherence to prompts');
console.log('- Duration "10" gives more time for complex scenes');
console.log('- Be very descriptive in prompts, mention "cinematic", "8K", etc.');

console.log('\n\n=== Common Issues ===');
console.log('1. Authorization errors: JWT tokens expire after 30 minutes');
console.log('2. Some endpoints may require "input" wrapper object');
console.log('3. Image generation endpoint might be /v1/images/text2image');
console.log('4. Voice IDs need to match available options');

// Generate a fresh JWT for testing
const jwt = await generateJWT(KLING_ACCESS_KEY, KLING_SECRET_KEY);
console.log('\n\n=== Fresh JWT Token for Testing ===');
console.log(jwt);