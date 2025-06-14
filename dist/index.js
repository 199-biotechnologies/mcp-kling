#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import KlingClient from './kling-client.js';
import dotenv from 'dotenv';
dotenv.config();
const KLING_ACCESS_KEY = process.env.KLING_ACCESS_KEY;
const KLING_SECRET_KEY = process.env.KLING_SECRET_KEY;
const KLING_DOWNLOAD_PATH = process.env.KLING_DOWNLOAD_PATH; // Optional custom download path
const KLING_AUTO_DOWNLOAD = process.env.KLING_AUTO_DOWNLOAD !== 'false'; // Default true
async function generateJWT(accessKey, secretKey) {
    const { SignJWT } = await import('jose');
    const secret = new TextEncoder().encode(secretKey);
    const currentTime = Math.floor(Date.now() / 1000);
    const jwt = await new SignJWT({
        iss: accessKey,
        exp: currentTime + 1800, // 30 minutes from now
        nbf: currentTime - 5, // Valid from 5 seconds ago
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
const server = new Server({
    name: 'mcp-kling',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
const TOOLS = [
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
                    enum: ['kling-v1', 'kling-v1.5', 'kling-v1.6', 'kling-v2-master'],
                    description: 'Model version to use (default: kling-v2-master)',
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
                camera_control: {
                    type: 'object',
                    description: 'Camera movement settings for V2 models',
                    properties: {
                        type: {
                            type: 'string',
                            enum: ['simple', 'down_back', 'forward_up', 'right_turn_forward', 'left_turn_forward'],
                            description: 'Camera movement type',
                        },
                        config: {
                            type: 'object',
                            description: 'Camera movement configuration (only for "simple" type)',
                            properties: {
                                horizontal: {
                                    type: 'number',
                                    description: 'Horizontal movement [-10, 10]',
                                    minimum: -10,
                                    maximum: 10,
                                },
                                vertical: {
                                    type: 'number',
                                    description: 'Vertical movement [-10, 10]',
                                    minimum: -10,
                                    maximum: 10,
                                },
                                pan: {
                                    type: 'number',
                                    description: 'Pan rotation [-10, 10]',
                                    minimum: -10,
                                    maximum: 10,
                                },
                                tilt: {
                                    type: 'number',
                                    description: 'Tilt rotation [-10, 10]',
                                    minimum: -10,
                                    maximum: 10,
                                },
                                roll: {
                                    type: 'number',
                                    description: 'Roll rotation [-10, 10]',
                                    minimum: -10,
                                    maximum: 10,
                                },
                                zoom: {
                                    type: 'number',
                                    description: 'Zoom [-10, 10]',
                                    minimum: -10,
                                    maximum: 10,
                                },
                            },
                        },
                    },
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
                    enum: ['kling-v1', 'kling-v1.5', 'kling-v1.6', 'kling-v2-master'],
                    description: 'Model version to use (default: kling-v2-master)',
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
    {
        name: 'extend_video',
        description: 'Extend a video by 4-5 seconds using Kling AI. This feature allows you to continue a video beyond its original ending, generating new content that seamlessly follows from the last frame. Perfect for creating longer sequences or adding additional scenes to existing videos.',
        inputSchema: {
            type: 'object',
            properties: {
                task_id: {
                    type: 'string',
                    description: 'The task ID of the original video to extend (from a previous generation)',
                },
                prompt: {
                    type: 'string',
                    description: 'Text prompt describing how to extend the video (what should happen next)',
                },
                model_name: {
                    type: 'string',
                    enum: ['kling-v1', 'kling-v1.5', 'kling-v1.6', 'kling-v2-master'],
                    description: 'Model version to use for extension (default: kling-v2-master)',
                },
                duration: {
                    type: 'string',
                    enum: ['5'],
                    description: 'Extension duration (fixed at 5 seconds)',
                },
                mode: {
                    type: 'string',
                    enum: ['standard', 'professional'],
                    description: 'Video generation mode (default: standard)',
                },
            },
            required: ['task_id', 'prompt'],
        },
    },
    {
        name: 'create_lipsync',
        description: 'Create a lip-sync video by synchronizing mouth movements with audio. Supports both text-to-speech (TTS) with various voice options or custom audio upload. The original video must contain a clear, steady human face with visible mouth. Works with real, 3D, or 2D human characters (not animals). Video length limited to 10 seconds.',
        inputSchema: {
            type: 'object',
            properties: {
                video_url: {
                    type: 'string',
                    description: 'URL of the video to apply lip-sync to (must contain clear human face)',
                },
                audio_url: {
                    type: 'string',
                    description: 'URL of custom audio file (mp3, wav, flac, ogg; max 20MB, 60s). If provided, TTS parameters are ignored',
                },
                tts_text: {
                    type: 'string',
                    description: 'Text for text-to-speech synthesis (used only if audio_url is not provided)',
                },
                tts_voice: {
                    type: 'string',
                    enum: ['male-warm', 'male-energetic', 'female-gentle', 'female-professional', 'male-deep', 'female-cheerful', 'male-calm', 'female-youthful'],
                    description: 'Voice style for TTS (default: male-warm). Includes Chinese and English voice options',
                },
                tts_speed: {
                    type: 'number',
                    description: 'Speech speed for TTS (0.5-2.0, default: 1.0)',
                    minimum: 0.5,
                    maximum: 2.0,
                },
                model_name: {
                    type: 'string',
                    enum: ['kling-v1', 'kling-v1.5', 'kling-v1.6', 'kling-v2-master'],
                    description: 'Model version to use (default: kling-v2-master)',
                },
            },
            required: ['video_url'],
        },
    },
    {
        name: 'apply_video_effect',
        description: 'Apply pre-defined animation effects to static images using Kling AI. Create emotionally expressive videos from portraits with effects like hugging, kissing, or playful animations. Dual-character effects (hug, kiss, heart_gesture) require exactly 2 images. Single-image effects (squish, expansion, fuzzyfuzzy, bloombloom, dizzydizzy) require 1 image. Perfect for social media content and creative storytelling.',
        inputSchema: {
            type: 'object',
            properties: {
                image_urls: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                    description: 'Array of image URLs. Use 2 images for hug/kiss/heart_gesture effects, 1 image for squish/expansion/fuzzyfuzzy/bloombloom/dizzydizzy effects',
                },
                effect_scene: {
                    type: 'string',
                    enum: ['hug', 'kiss', 'heart_gesture', 'squish', 'expansion', 'fuzzyfuzzy', 'bloombloom', 'dizzydizzy'],
                    description: 'The animation effect to apply. Dual-character: hug, kiss, heart_gesture. Single-image: squish, expansion, fuzzyfuzzy, bloombloom, dizzydizzy',
                },
                duration: {
                    type: 'string',
                    enum: ['5', '10'],
                    description: 'Video duration in seconds (default: 5)',
                },
                model_name: {
                    type: 'string',
                    enum: ['kling-v1', 'kling-v1.5', 'kling-v1.6', 'kling-v2-master'],
                    description: 'Model version to use (default: kling-v2-master)',
                },
            },
            required: ['image_urls', 'effect_scene'],
        },
    },
    {
        name: 'generate_image',
        description: 'Generate images from text prompts using Kling AI. Create high-quality images with multiple aspect ratios and optional character reference support. Supports models v1, v1.5, and v2 with customizable parameters for creative control.',
        inputSchema: {
            type: 'object',
            properties: {
                prompt: {
                    type: 'string',
                    description: 'Text prompt describing the image to generate',
                },
                negative_prompt: {
                    type: 'string',
                    description: 'Text describing what to avoid in the image (optional)',
                },
                model_name: {
                    type: 'string',
                    enum: ['kling-v1', 'kling-v1.5', 'kling-v1.6', 'kling-v2-master'],
                    description: 'Model version to use (default: kling-v2-master)',
                },
                aspect_ratio: {
                    type: 'string',
                    enum: ['16:9', '9:16', '1:1', '4:3', '3:4', '2:3', '3:2'],
                    description: 'Image aspect ratio (default: 1:1)',
                },
                num_images: {
                    type: 'number',
                    description: 'Number of images to generate (default: 1)',
                    minimum: 1,
                    maximum: 4,
                },
                ref_image_url: {
                    type: 'string',
                    description: 'Optional reference image URL for character consistency',
                },
                ref_image_weight: {
                    type: 'number',
                    description: 'Weight of reference image influence (0-1, default: 0.5)',
                    minimum: 0,
                    maximum: 1,
                },
            },
            required: ['prompt'],
        },
    },
    {
        name: 'check_image_status',
        description: 'Check the status of an image generation task',
        inputSchema: {
            type: 'object',
            properties: {
                task_id: {
                    type: 'string',
                    description: 'The task ID returned from generate_image',
                },
            },
            required: ['task_id'],
        },
    },
    {
        name: 'virtual_try_on',
        description: 'Apply virtual clothing try-on to a person image using AI. Upload a person image and up to 5 clothing items to see how they would look wearing those clothes. Supports both single and multiple clothing combinations for complete outfit visualization.',
        inputSchema: {
            type: 'object',
            properties: {
                person_image_url: {
                    type: 'string',
                    description: 'URL of the person image to try clothes on',
                },
                cloth_image_urls: {
                    type: 'array',
                    items: {
                        type: 'string',
                    },
                    description: 'Array of clothing image URLs (1-5 items). Multiple items will be combined into a complete outfit',
                    minItems: 1,
                    maxItems: 5,
                },
                model_name: {
                    type: 'string',
                    enum: ['kolors-virtual-try-on-v1', 'kolors-virtual-try-on-v1.5'],
                    description: 'Model version to use (default: kolors-virtual-try-on-v1.5)',
                },
            },
            required: ['person_image_url', 'cloth_image_urls'],
        },
    },
    {
        name: 'get_resource_packages',
        description: 'Get detailed information about your Kling AI resource packages including remaining credits, expiration dates, and package types. Useful for monitoring API usage and planning resource allocation.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'get_account_balance',
        description: 'Check your Kling AI account balance and total available credits. Provides a comprehensive overview of your account status including total balance and breakdown by resource packages.',
        inputSchema: {
            type: 'object',
            properties: {},
            required: [],
        },
    },
    {
        name: 'list_tasks',
        description: 'List all your Kling AI generation tasks with filtering options. View task history, check statuses, and filter by date range or status. Supports pagination for browsing through large task lists.',
        inputSchema: {
            type: 'object',
            properties: {
                page: {
                    type: 'number',
                    description: 'Page number for pagination (default: 1)',
                    minimum: 1,
                },
                page_size: {
                    type: 'number',
                    description: 'Number of tasks per page (default: 10, max: 100)',
                    minimum: 1,
                    maximum: 100,
                },
                status: {
                    type: 'string',
                    enum: ['submitted', 'processing', 'succeed', 'failed'],
                    description: 'Filter tasks by status',
                },
                start_time: {
                    type: 'string',
                    description: 'Filter tasks created after this time (ISO 8601 format)',
                },
                end_time: {
                    type: 'string',
                    description: 'Filter tasks created before this time (ISO 8601 format)',
                },
            },
            required: [],
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
                const videoRequest = {
                    prompt: args.prompt,
                    negative_prompt: args.negative_prompt,
                    model_name: args.model_name || 'kling-v2-master',
                    aspect_ratio: args.aspect_ratio || '16:9',
                    duration: args.duration || '5',
                    mode: args.mode || 'standard',
                    cfg_scale: args.cfg_scale ?? 0.5,
                    camera_control: args.camera_control,
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
                const videoRequest = {
                    prompt: args.prompt,
                    negative_prompt: args.negative_prompt,
                    model_name: args.model_name || 'kling-v2-master',
                    duration: args.duration || '5',
                    mode: args.mode || 'standard',
                    cfg_scale: args.cfg_scale ?? 0.5,
                    image_url: args.image_url,
                    image_tail_url: args.image_tail_url,
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
                const status = await klingClient.getTaskStatus(args.task_id);
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
            case 'extend_video': {
                const extendRequest = {
                    task_id: args.task_id,
                    prompt: args.prompt,
                    model_name: args.model_name || 'kling-v2-master',
                    duration: '5',
                    mode: args.mode || 'standard',
                };
                const result = await klingClient.extendVideo(extendRequest);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Video extension started successfully!\nTask ID: ${result.task_id}\n\nThe video will be extended by approximately 5 seconds.\nUse the check_video_status tool with this task ID to check the progress.`,
                        },
                    ],
                };
            }
            case 'create_lipsync': {
                const lipsyncRequest = {
                    video_url: args.video_url,
                    audio_url: args.audio_url,
                    tts_text: args.tts_text,
                    tts_voice: args.tts_voice,
                    tts_speed: args.tts_speed ?? 1.0,
                    model_name: args.model_name || 'kling-v2-master',
                };
                // Validate that either audio_url or tts_text is provided
                if (!lipsyncRequest.audio_url && !lipsyncRequest.tts_text) {
                    throw new Error('Either audio_url or tts_text must be provided for lip-sync');
                }
                const result = await klingClient.createLipsync(lipsyncRequest);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Lip-sync video creation started successfully!\nTask ID: ${result.task_id}\n\nThe video will be processed with ${lipsyncRequest.audio_url ? 'custom audio' : 'text-to-speech'}.\nUse the check_video_status tool with this task ID to check the progress.`,
                        },
                    ],
                };
            }
            case 'apply_video_effect': {
                const effectRequest = {
                    image_urls: args.image_urls,
                    effect_scene: args.effect_scene,
                    duration: args.duration || '5',
                    model_name: args.model_name || 'kling-v2-master',
                };
                const result = await klingClient.applyVideoEffect(effectRequest);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Video effect "${effectRequest.effect_scene}" applied successfully!\nTask ID: ${result.task_id}\n\nThe effect video is being generated.\nUse the check_video_status tool with this task ID to check the progress.`,
                        },
                    ],
                };
            }
            case 'generate_image': {
                const imageRequest = {
                    prompt: args.prompt,
                    negative_prompt: args.negative_prompt,
                    model_name: args.model_name || 'kling-v2-master',
                    aspect_ratio: args.aspect_ratio || '1:1',
                    num_images: args.num_images || 1,
                    ref_image_url: args.ref_image_url,
                    ref_image_weight: args.ref_image_weight ?? 0.5,
                };
                const result = await klingClient.generateImage(imageRequest);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Image generation started successfully!\nTask ID: ${result.task_id}\n\nGenerating ${imageRequest.num_images} image(s) with aspect ratio ${imageRequest.aspect_ratio}.\nUse the check_image_status tool with this task ID to check the progress.`,
                        },
                    ],
                };
            }
            case 'check_image_status': {
                const status = await klingClient.getImageTaskStatus(args.task_id);
                let statusText = `Task ID: ${status.task_id}\nStatus: ${status.task_status}`;
                if (status.task_status_msg) {
                    statusText += `\nMessage: ${status.task_status_msg}`;
                }
                if (status.task_status === 'succeed' && status.task_result?.images) {
                    statusText += '\n\nGenerated Images:';
                    status.task_result.images.forEach((image, index) => {
                        statusText += `\n\nImage ${index + 1}:`;
                        statusText += `\n- URL: ${image.url}`;
                        if (image.width && image.height) {
                            statusText += `\n- Dimensions: ${image.width}x${image.height}`;
                        }
                    });
                    statusText += '\n\nNote: Images will be cleared after 30 days for security.';
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
            case 'virtual_try_on': {
                const tryOnRequest = {
                    person_image_url: args.person_image_url,
                    cloth_image_urls: args.cloth_image_urls,
                    model_name: args.model_name || 'kolors-virtual-try-on-v1.5',
                };
                const result = await klingClient.virtualTryOn(tryOnRequest);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Virtual try-on started successfully!\nTask ID: ${result.task_id}\n\nThe AI is processing your virtual try-on with ${tryOnRequest.cloth_image_urls.length} clothing item(s).\nUse the check_video_status tool with this task ID to check the progress and retrieve the try-on result video.`,
                        },
                    ],
                };
            }
            case 'get_resource_packages': {
                const packages = await klingClient.getResourcePackages();
                let packagesText = 'Your Kling AI Resource Packages:\n';
                if (packages.length === 0) {
                    packagesText += '\nNo active resource packages found.';
                }
                else {
                    packages.forEach((pkg, index) => {
                        packagesText += `\n\nPackage ${index + 1}:`;
                        packagesText += `\n- Name: ${pkg.name}`;
                        packagesText += `\n- Resource ID: ${pkg.resource_id}`;
                        packagesText += `\n- Amount: ${pkg.amount}`;
                        packagesText += `\n- Expires: ${new Date(pkg.expire_at).toLocaleString()}`;
                        packagesText += `\n- Created: ${new Date(pkg.created_at).toLocaleString()}`;
                    });
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: packagesText,
                        },
                    ],
                };
            }
            case 'get_account_balance': {
                const balance = await klingClient.getAccountBalance();
                let balanceText = `Kling AI Account Balance:\n\nTotal Balance: ${balance.total_balance} credits`;
                if (balance.resource_packages && balance.resource_packages.length > 0) {
                    balanceText += '\n\nResource Packages Breakdown:';
                    balance.resource_packages.forEach((pkg, index) => {
                        balanceText += `\n\nPackage ${index + 1}:`;
                        balanceText += `\n- Name: ${pkg.name}`;
                        balanceText += `\n- Amount: ${pkg.amount} credits`;
                        balanceText += `\n- Expires: ${new Date(pkg.expire_at).toLocaleString()}`;
                    });
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: balanceText,
                        },
                    ],
                };
            }
            case 'list_tasks': {
                const params = {
                    page: args.page,
                    page_size: args.page_size,
                    status: args.status,
                    start_time: args.start_time,
                    end_time: args.end_time,
                };
                const taskList = await klingClient.listTasks(params);
                let tasksText = `Kling AI Task List (Page ${params.page || 1}):\n`;
                tasksText += `\nTotal Tasks: ${taskList.total || 0}`;
                if (taskList.tasks && taskList.tasks.length > 0) {
                    tasksText += '\n\nTasks:';
                    taskList.tasks.forEach((task, index) => {
                        tasksText += `\n\n${index + 1}. Task ID: ${task.task_id}`;
                        tasksText += `\n   Type: ${task.task_type || 'N/A'}`;
                        tasksText += `\n   Status: ${task.task_status}`;
                        tasksText += `\n   Created: ${new Date(task.created_at * 1000).toLocaleString()}`;
                        if (task.updated_at) {
                            tasksText += `\n   Updated: ${new Date(task.updated_at * 1000).toLocaleString()}`;
                        }
                        if (task.model_name) {
                            tasksText += `\n   Model: ${task.model_name}`;
                        }
                    });
                }
                else {
                    tasksText += '\n\nNo tasks found.';
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: tasksText,
                        },
                    ],
                };
            }
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
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
