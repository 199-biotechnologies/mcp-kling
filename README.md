# 🎬 MCP Kling - The FIRST Kling AI Video Generation MCP Server!

[![npm version](https://img.shields.io/npm/v/mcp-kling.svg)](https://www.npmjs.com/package/mcp-kling)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The world's first MCP server for Kling AI video generation!** 🚀

Generate stunning AI videos directly from Claude using text prompts or transform your images into captivating videos. This groundbreaking integration brings the power of Kling's advanced video generation models directly to your Claude conversations.

## 🌟 Why This is HUGE

- **First of its kind**: The ONLY MCP server for Kling AI video generation
- **Automate video creation**: Generate videos programmatically through Claude
- **Multiple models**: Access Kling v1.0, v1.5, and the latest v1.6
- **Versatile generation**: Both text-to-video and image-to-video capabilities
- **Professional quality**: Support for professional mode with higher quality output
- **Perfect for**: Content creators, marketers, developers, and AI enthusiasts

## 🚀 Quick Start

It's incredibly easy to get started!

### 1. Get your Kling API JWT Token

1. Go to [Kling AI Developer Console](https://app.klingai.com/global/dev/api-key)
2. Click **"+ Create a new API Key"** to generate your Access Key and Secret Key
3. Generate your JWT token:
   - Option A: Use the **"JWT Verification"** button on Kling's website (if available)
   - Option B: Generate it yourself using your Access Key and Secret Key (see below)

#### Generating JWT Token Manually

If the JWT Verification page has issues, you can generate your JWT token using Node.js:

```javascript
// save as generate-jwt.js
import * as jose from 'jose';

const ACCESS_KEY = 'your_access_key';
const SECRET_KEY = 'your_secret_key';

async function generateJWT() {
  const secret = new TextEncoder().encode(SECRET_KEY);
  
  const jwt = await new jose.SignJWT({ 
    iss: ACCESS_KEY,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30 days
    iat: Math.floor(Date.now() / 1000)
  })
    .setProtectedHeader({ alg: 'HS256' })
    .sign(secret);
  
  console.log('Your JWT Token:');
  console.log(jwt);
}

generateJWT();
```

Run with: `npm install jose && node generate-jwt.js`

### 2. Add to Claude Desktop

Add this configuration to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mcp-kling": {
      "command": "npx",
      "args": ["-y", "mcp-kling@latest"],
      "env": {
        "KLING_JWT": "YOUR_JWT_TOKEN_HERE"
      }
    }
  }
}
```

That's it! Restart Claude Desktop and you're ready to generate amazing videos! 🎉

## 🛠️ Available Tools

### 1. `generate_video`
Create videos from text descriptions.

Example prompts:
- "A cyberpunk city at night with neon lights"
- "A cat playing piano in a concert hall"
- "Time-lapse of flowers blooming in spring"

### 2. `generate_image_to_video`
Bring your images to life with motion.

Perfect for:
- Animating artwork
- Creating dynamic presentations
- Turning photos into cinematic sequences

### 3. `check_video_status`
Monitor your video generation progress and get the final video URLs.

## 💡 Example Usage in Claude

```
You: Generate a video of a futuristic robot dancing in a disco

Claude: I'll generate a fun video of a futuristic robot dancing in a disco for you!

[Using generate_video tool...]

Video generation started successfully!
Task ID: k123456789

Let me check the status...

[Using check_video_status tool...]

Your video is ready! 
- URL: https://...
- Duration: 5 seconds
- Aspect Ratio: 16:9
```

## 🎯 Use Cases

- **Content Creation**: Automate video generation for social media
- **Marketing**: Create product demos and promotional videos
- **Education**: Generate educational content and visualizations
- **Entertainment**: Create stories, animations, and artistic videos
- **Prototyping**: Quickly visualize ideas and concepts

## 🔧 Advanced Options

- **Models**: Choose between v1.0, v1.5, or v1.6
- **Aspect Ratios**: 16:9, 9:16, 1:1
- **Duration**: 5 or 10 seconds
- **Modes**: Standard or Professional
- **Creative Control**: Adjust cfg_scale (0-1) for creativity vs prompt adherence

## 🤝 Contributing

We welcome contributions! This is just the beginning of AI video automation.

## 📝 License

MIT License - feel free to use in your projects!

## 👥 Authors

Created by Boris Djordjevic and the 199 Longevity team.

---

**Ready to revolutionize video creation with AI? Install now and start generating!** 🚀