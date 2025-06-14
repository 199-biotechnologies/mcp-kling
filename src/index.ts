#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import KlingClient, { VideoGenerationRequest } from './kling-client.js';
import dotenv from 'dotenv';

dotenv.config();

const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;
const KLING_DOWNLOAD_PATH = process.env.KLING_DOWNLOAD_PATH; // Optional custom download path
const KLING_AUTO_DOWNLOAD = process.env.KLING_AUTO_DOWNLOAD !== 'false'; // Default true

async function generateJWT(accessKey: string, secretKey: string): Promise<string> {
  const { SignJWT } = await import('jose');
  const secret = new TextEncoder().encode(secretKey);
  const currentTime = Math.floor(Date.now() / 1000);
  
  const jwt = await new SignJWT({ 
    iss: accessKey,
    exp: currentTime + 1800, // 30 minutes from now
    nbf: currentTime - 5,     // Valid from 5 seconds ago
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(secret);
  
  return jwt;
}

if (!KLING_ACCESS_KEY || !KLING_SECRET_KEY) {
  console.error('Error: KLING_ACCESS_KEY and KLING_SECRET_KEY environment variables are required.');
  console.error('\nPlease add them to your Claude Desktop configuration:');
  console.error('"env": {');
  console.error('  "KLING_ACCESS_KEY": "your_access_key",');
  console.error('  "KLING_SECRET_KEY": "your_secret_key"');
  console.error('}');
  console.error('\nTo get your keys:');
  console.error('1. Go to klingai.com developer console');
  console.error('2. Create a new API key');
  console.error('3. Copy both Access Key and Secret Key');
  process.exit(1);
}

// Generate JWT token on startup
const jwt = await generateJWT(KLING_ACCESS_KEY, KLING_SECRET_KEY);
const klingClient = new KlingClient(jwt);

const server = new Server(
  {
    name: 'mcp-kling',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const TOOLS: Tool[] = [
  {
    name: 'generate_video',
    description: 'Generate a video from text prompt using Kling AI',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Text prompt describing the video to generate (max 2500 characters)',
        },
        negative_prompt: {
          type: 'string',
          description: 'Text describing what to avoid in the video (optional, max 2500 characters)',
        },
        model_name: {
          type: 'string',
          enum: ['kling-v1', 'kling-v1.5', 'kling-v1.6'],
          description: 'Model version to use (default: kling-v1.6)',
        },
        aspect_ratio: {
          type: 'string',
          enum: ['16:9', '9:16', '1:1'],
          description: 'Video aspect ratio (default: 16:9)',
        },
        duration: {
          type: 'string',
          enum: ['5', '10'],
          description: 'Video duration in seconds (default: 5)',
        },
        mode: {
          type: 'string',
          enum: ['standard', 'professional'],
          description: 'Video generation mode (default: standard)',
        },
        cfg_scale: {
          type: 'number',
          description: 'Creative freedom scale 0-1 (0=more creative, 1=more adherent to prompt, default: 0.5)',
          minimum: 0,
          maximum: 1,
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'generate_image_to_video',
    description: 'Generate a video from an image using Kling AI',
    inputSchema: {
      type: 'object',
      properties: {
        image_url: {
          type: 'string',
          description: 'URL of the starting image',
        },
        image_tail_url: {
          type: 'string',
          description: 'URL of the ending image (optional)',
        },
        prompt: {
          type: 'string',
          description: 'Text prompt describing the motion and transformation',
        },
        negative_prompt: {
          type: 'string',
          description: 'Text describing what to avoid in the video (optional)',
        },
        model_name: {
          type: 'string',
          enum: ['kling-v1.5', 'kling-v1.6'],
          description: 'Model version to use (default: kling-v1.5)',
        },
        duration: {
          type: 'string',
          enum: ['5', '10'],
          description: 'Video duration in seconds (default: 5)',
        },
        mode: {
          type: 'string',
          enum: ['standard', 'professional'],
          description: 'Video generation mode (default: standard)',
        },
        cfg_scale: {
          type: 'number',
          description: 'Creative freedom scale 0-1 (default: 0.5)',
          minimum: 0,
          maximum: 1,
        },
      },
      required: ['image_url', 'prompt'],
    },
  },
  {
    name: 'check_video_status',
    description: 'Check the status of a video generation task',
    inputSchema: {
      type: 'object',
      properties: {
        task_id: {
          type: 'string',
          description: 'The task ID returned from generate_video or generate_image_to_video',
        },
      },
      required: ['task_id'],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('No arguments provided');
  }

  try {
    switch (name) {
      case 'generate_video': {
        const videoRequest: VideoGenerationRequest = {
          prompt: args.prompt as string,
          negative_prompt: args.negative_prompt as string | undefined,
          model_name: (args.model_name as 'kling-v1' | 'kling-v1.5' | 'kling-v1.6') || 'kling-v1.6',
          aspect_ratio: (args.aspect_ratio as '16:9' | '9:16' | '1:1') || '16:9',
          duration: (args.duration as '5' | '10') || '5',
          mode: (args.mode as 'standard' | 'professional') || 'standard',
          cfg_scale: (args.cfg_scale as number) ?? 0.5,
        };

        const result = await klingClient.generateVideo(videoRequest);
        
        return {
          content: [
            {
              type: 'text',
              text: `Video generation started successfully!\nTask ID: ${result.task_id}\n\nUse the check_video_status tool with this task ID to check the progress.`,
            },
          ],
        };
      }

      case 'generate_image_to_video': {
        const videoRequest: VideoGenerationRequest = {
          prompt: args.prompt as string,
          negative_prompt: args.negative_prompt as string | undefined,
          model_name: (args.model_name as 'kling-v1.5' | 'kling-v1.6') || 'kling-v1.5',
          duration: (args.duration as '5' | '10') || '5',
          mode: (args.mode as 'standard' | 'professional') || 'standard',
          cfg_scale: (args.cfg_scale as number) ?? 0.5,
          image_url: args.image_url as string,
          image_tail_url: args.image_tail_url as string | undefined,
        };

        const result = await klingClient.generateImageToVideo(videoRequest);
        
        return {
          content: [
            {
              type: 'text',
              text: `Image-to-video generation started successfully!\nTask ID: ${result.task_id}\n\nUse the check_video_status tool with this task ID to check the progress.`,
            },
          ],
        };
      }

      case 'check_video_status': {
        const status = await klingClient.getTaskStatus(args.task_id as string);
        
        let statusText = `Task ID: ${status.task_id}\nStatus: ${status.task_status}`;
        
        if (status.task_status_msg) {
          statusText += `\nMessage: ${status.task_status_msg}`;
        }
        
        if (status.task_status === 'succeed' && status.task_result?.videos) {
          statusText += '\n\nGenerated Videos:';
          status.task_result.videos.forEach((video, index) => {
            statusText += `\n\nVideo ${index + 1}:`;
            statusText += `\n- URL: ${video.url}`;
            statusText += `\n- Duration: ${video.duration}`;
            statusText += `\n- Aspect Ratio: ${video.aspect_ratio}`;
          });
          statusText += '\n\nNote: Videos will be cleared after 30 days for security.';
        }
        
        return {
          content: [
            {
              type: 'text',
              text: statusText,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Kling MCP server running');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});