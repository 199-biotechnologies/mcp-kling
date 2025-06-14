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

const KLING_JWT = process.env.KLING_JWT;

if (!KLING_JWT) {
  console.error('Error: KLING_JWT environment variable is required.');
  console.error('\nPlease add it to your Claude Desktop configuration:');
  console.error('"env": {');
  console.error('  "KLING_JWT": "your_jwt_token"');
  console.error('}');
  console.error('\nTo get your JWT token:');
  console.error('1. Go to klingai.com and create an API key');
  console.error('2. Click "JWT Verification" to generate your JWT token');
  console.error('3. Copy the JWT token and add it to your config');
  process.exit(1);
}

const klingClient = new KlingClient(KLING_JWT);

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