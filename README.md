# 🎬 MCP Kling - The ONLY COMPLETE Kling AI MCP Server!

[![npm version](https://img.shields.io/npm/v/mcp-kling.svg)](https://www.npmjs.com/package/mcp-kling)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The world's FIRST and ONLY complete MCP server for Kling AI - now with FULL API support!** 🚀

Transform Claude into a professional AI content studio with complete access to Kling's entire suite of creative tools. Generate videos, create images, add lip-sync, apply effects, and even try on virtual clothing - all through simple conversations with Claude. This isn't just another integration; it's the COMPLETE Kling experience!

## 🌟 Why This is HUGE

- **100% COMPLETE**: The ONLY MCP server implementing ALL Kling AI features
- **13+ Tools**: Full access to video, image, effects, lip-sync, and more
- **Auto-Download**: Automatically saves all generated content locally
- **Multiple Models**: Access Kling v1.0, v1.5, v1.6, and KOLORS for images
- **Professional Studio**: Create complete productions with effects and audio
- **Account Management**: Monitor balance and resource usage
- **Perfect for**: Content creators, filmmakers, marketers, developers, and AI enthusiasts

## 🚀 Quick Start

It's incredibly easy to get started!

### 1. Get your Kling API Credentials

1. Go to [Kling AI Developer Console](https://app.klingai.com/global/dev/api-key)
2. Click **"+ Create a new API Key"**
3. Save both your **Access Key** and **Secret Key**

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
        "KLING_ACCESS_KEY": "YOUR_ACCESS_KEY_HERE",
        "KLING_SECRET_KEY": "YOUR_SECRET_KEY_HERE"
      }
    }
  }
}
```

The MCP server will automatically generate JWT tokens as needed using your credentials.

That's it! Restart Claude Desktop and you're ready to generate amazing videos! 🎉

## 🛠️ Complete Feature Set - ALL 13 Tools!

### 🎥 Video Generation

#### 1. `generate_video`
Create stunning videos from text descriptions.
- **Models**: v1.0, v1.5, v1.6
- **Duration**: 5 or 10 seconds
- **Aspect Ratios**: 16:9, 9:16, 1:1
- **Modes**: Standard or Professional

#### 2. `generate_image_to_video`
Transform static images into dynamic videos.
- **Image Types**: PNG, JPG, JPEG, WebP
- **Motion Control**: Automatic or custom prompts
- **Camera Movement**: Static, zoom, pan, or auto

#### 3. `check_video_status`
Monitor generation progress and auto-download completed videos.

#### 4. `extend_video`
Seamlessly extend videos by 4-5 seconds.
- **Smart Continuation**: AI understands context
- **Custom Prompts**: Guide the extension direction
- **Multiple Extensions**: Chain for longer videos

### 🎙️ Audio & Effects

#### 5. `create_lipsync`
Synchronize lip movements with audio.
- **Custom Audio**: MP3, WAV, FLAC, OGG
- **Text-to-Speech**: 8 voice styles
- **Speed Control**: 0.8x to 1.5x
- **Auto-Download**: Saves both video and audio

#### 6. `apply_video_effect`
Professional post-production effects.
- **Fast Motion**: Speed up 2x-16x
- **Slow Motion**: Slow down 0.5x-0.9x
- **Reverse**: Play videos backward
- **Loop**: Create seamless loops

### 🎨 Image Generation

#### 7. `generate_image`
Create stunning images with KOLORS model.
- **Resolutions**: Up to 2K quality
- **Aspect Ratios**: 16:9, 9:16, 1:1, 2:3, 3:2
- **Styles**: Photorealistic or artistic
- **Batch Generation**: Up to 4 images

#### 8. `check_image_status`
Monitor and auto-download generated images.

#### 9. `virtual_try_on`
Revolutionary AI fashion try-on.
- **Model Image**: Your photo (full body preferred)
- **Garment Image**: Clothing to try on
- **Smart Fitting**: AI adjusts to body type
- **Realistic Results**: Natural fabric draping

### 📊 Account Management

#### 10. `get_account_balance`
Check your Kling credit balance.

#### 11. `get_resource_packages`
View available subscription packages.

#### 12. `list_tasks`
Track all your generation tasks.
- **Pagination**: Handle large task lists
- **Filtering**: By date or status
- **Complete History**: All your creations

## 💡 Complete Examples for Every Feature

### 🎬 Video Generation
```
You: Generate a video of a futuristic robot dancing in a disco

Claude: I'll create an amazing robot disco video for you!

[Using generate_video tool...]
✅ Video generation started!
Task ID: k123456789

[Auto-checking status...]
🎉 Your video is ready and downloaded!
- File: ./downloads/videos/robot_disco_k123456789.mp4
- Duration: 5 seconds
- Resolution: 1920x1080
```

### 🔄 Video Extension Chain
```
You: Extend that robot video 3 times with: 1) backflip, 2) moonwalk, 3) fireworks finale

Claude: I'll create an epic extended sequence!

[Extension 1: Backflip]
✅ Extended by 5 seconds

[Extension 2: Moonwalk] 
✅ Extended by 5 seconds

[Extension 3: Fireworks]
✅ Extended by 5 seconds

🎬 Final video: 20 seconds total!
```

### 🎙️ Lip Sync with TTS
```
You: Make the CEO in this video say "Welcome to our product launch" in a professional male voice

Claude: I'll add professional narration to your CEO video.

[Using create_lipsync with TTS...]
✅ Lip-sync video created!
- Voice: Professional Male
- Speed: 1.0x
- Downloaded: ./downloads/lipsync/ceo_welcome_k987654321.mp4
```

### 🎨 Image Generation Batch
```
You: Generate 4 images of "cyberpunk cat with neon glasses" in different styles

Claude: Creating a batch of cyberpunk cat images!

[Using generate_image tool...]
✅ Generated 4 unique images:
- ./downloads/images/cyberpunk_cat_1.png
- ./downloads/images/cyberpunk_cat_2.png
- ./downloads/images/cyberpunk_cat_3.png
- ./downloads/images/cyberpunk_cat_4.png
```

### 👗 Virtual Try-On
```
You: Try this red dress (dress.jpg) on my photo (me.jpg)

Claude: I'll help you virtually try on that dress!

[Using virtual_try_on tool...]
✅ Virtual try-on complete!
- Result: ./downloads/tryon/red_dress_result.mp4
- The dress fits perfectly and moves naturally!
```

### 🎯 Video Effects Combo
```
You: Apply slow motion to the first half and fast motion to the second half

Claude: Creating a dramatic tempo change effect!

[Step 1: Splitting video...]
[Step 2: Slow motion on part 1...]
[Step 3: Fast motion on part 2...]
✅ Effect applied! Downloaded to: ./downloads/effects/tempo_change.mp4
```

### 📊 Account Management
```
You: Check my balance and show me what I can create

Claude: Let me check your account details!

[Using get_account_balance tool...]
💰 Current Balance: 5,000 credits

With your balance, you can create:
- 50 standard videos (100 credits each)
- 25 professional videos (200 credits each)  
- 100 images (50 credits each)
- 33 lip-sync videos (150 credits each)
```

## 🎯 Revolutionary Use Cases

### 🎬 Film & Video Production
- **Storyboarding**: Rapidly prototype scenes
- **VFX Previsualization**: Test effects before shooting
- **B-Roll Generation**: Create supplementary footage
- **Music Videos**: Generate visuals for songs

### 📱 Social Media Automation
- **TikTok/Reels**: Auto-generate trending content
- **Product Showcases**: Dynamic product videos
- **Story Series**: Chain extended videos
- **Branded Effects**: Apply consistent styles

### 🛍️ E-Commerce Revolution
- **Virtual Fashion Shows**: Model clothes on anyone
- **Product Animations**: Bring static products to life
- **Try-Before-Buy**: Virtual clothing trials
- **360° Product Views**: Generated from single image

### 🎓 Education & Training
- **Animated Explanations**: Complex concepts simplified
- **Language Learning**: Lip-sync in any language
- **Historical Recreations**: Bring history to life
- **Scientific Visualizations**: Abstract concepts visualized

## 🚀 Auto-Download Magic

All generated content is automatically downloaded and organized:

```
./downloads/
├── videos/          # Generated videos
├── images/          # Generated images  
├── lipsync/         # Lip-sync videos
├── effects/         # Effect-applied videos
├── extended/        # Extended videos
└── tryon/          # Virtual try-on results
```

Never lose your creations - everything is saved locally with descriptive filenames!

## 🔧 Advanced Configuration

### Video Generation Options
```javascript
{
  model: "kling_v1.6",        // v1.0, v1.5, or v1.6
  duration: 10,               // 5 or 10 seconds
  aspect_ratio: "16:9",       // 16:9, 9:16, 1:1
  mode: "professional",       // standard or professional
  cfg_scale: 0.7,            // 0-1 (creativity vs accuracy)
  camera_movement: "auto"     // static, zoom, pan, auto
}
```

### Image Generation Options
```javascript
{
  model: "kolors",            // Currently supports KOLORS
  aspect_ratio: "16:9",       // Multiple ratios supported
  image_count: 4,             // 1-4 images per request
  resolution: "2k"            // Up to 2K quality
}
```

## 🏆 Why Choose MCP Kling?

### ✅ Feature Complete
- **ONLY** server with 100% Kling API coverage
- **13 tools** vs others with just 2-3
- **Auto-download** everything
- **Professional features** included

### ⚡ Production Ready
- **Robust error handling**
- **Automatic retries**
- **Progress tracking**
- **Local file management**

### 🎨 Creative Freedom
- **Chain operations** for complex workflows
- **Batch processing** for efficiency
- **Effect combinations** for unique results
- **No limits** on creativity

## 🤝 Contributing

We welcome contributions! Join us in building the future of AI content creation.

### Ideas for Contributors:
- Custom effect presets
- Workflow templates
- Integration examples
- Performance optimizations

## 📝 License

MIT License - feel free to use in your projects!

## 👥 Authors

Created with ❤️ by Boris Djordjevic and the 199 Longevity team.

## 🌟 Star Us!

If you find this useful, please star the repository! It helps others discover this complete Kling integration.

---

**🚀 The ONLY complete Kling MCP server - Install now and unlock the full power of AI content creation!**

*No other MCP server comes close - this is the complete package!*