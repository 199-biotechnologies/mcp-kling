import axios, { AxiosInstance } from 'axios';
import * as jose from 'jose';
import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import path from 'path';
import { homedir } from 'os';

export interface VideoGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  model_name?: 'kling-v1' | 'kling-v1.5' | 'kling-v1.6' | 'kling-v2';
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  duration?: '5' | '10';
  mode?: 'standard' | 'professional';
  cfg_scale?: number;
  image_url?: string;
  image_tail_url?: string;
  ref_image_url?: string;
  ref_image_weight?: number;
}

export interface TaskStatus {
  task_id: string;
  task_status: 'submitted' | 'processing' | 'succeed' | 'failed';
  task_status_msg?: string;
  created_at?: number;
  updated_at?: number;
  task_result?: {
    videos?: Array<{
      id: string;
      url: string;
      duration: string;
      aspect_ratio: string;
    }>;
  };
}

export interface VideoExtensionRequest {
  task_id: string;
  prompt: string;
  model_name?: 'kling-v1' | 'kling-v1.5' | 'kling-v1.6' | 'kling-v2';
  duration?: '5';
  mode?: 'standard' | 'professional';
}

export interface LipsyncRequest {
  video_url: string;
  audio_url?: string;
  tts_text?: string;
  tts_voice?: string;
  tts_speed?: number;
  model_name?: 'kling-v1' | 'kling-v1.5';
}

export interface VideoEffectsRequest {
  image_urls: string[];
  effect_scene: 'hug' | 'kiss' | 'heart_gesture' | 'squish' | 'expansion' | 'fuzzyfuzzy' | 'bloombloom' | 'dizzydizzy';
  duration?: '5' | '10';
  model_name?: 'kling-v1' | 'kling-v1.5' | 'kling-v1.6' | 'kling-v2';
}

export interface ImageGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  model_name?: 'kling-v1' | 'kling-v1.5' | 'kling-v1.6' | 'kling-v2';
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '2:3' | '3:2';
  num_images?: number;
  ref_image_url?: string;
  ref_image_weight?: number;
}

export interface VirtualTryOnRequest {
  person_image_url: string;
  cloth_image_urls: string[];
  model_name?: 'kolors-virtual-try-on-v1' | 'kolors-virtual-try-on-v1.5';
}

export interface ResourcePackage {
  resource_id: string;
  name: string;
  amount: number;
  expire_at: string;
  created_at: string;
}

export interface AccountBalance {
  total_balance: number;
  resource_packages: ResourcePackage[];
}

export interface TaskListParams {
  page?: number;
  page_size?: number;
  status?: 'submitted' | 'processing' | 'succeed' | 'failed';
  start_time?: string;
  end_time?: string;
}

export default class KlingClient {
  private jwt: string;
  private axiosInstance: AxiosInstance;

  constructor(jwt: string) {
    this.jwt = jwt;
    this.axiosInstance = axios.create({
      baseURL: 'https://api-singapore.klingai.com',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      }
    });
  }

  async generateVideo(request: VideoGenerationRequest): Promise<{ task_id: string }> {
    const path = '/v1/videos/text2video';
    
    const body: any = {
      prompt: request.prompt,
      negative_prompt: request.negative_prompt || '',
      cfg_scale: request.cfg_scale || 0.8,
      aspect_ratio: request.aspect_ratio || '16:9',
      duration: request.duration || '5',
      ...(request.image_url && { image_url: request.image_url }),
      ...(request.image_tail_url && { image_tail_url: request.image_tail_url }),
      ...(request.ref_image_url && { ref_image_url: request.ref_image_url }),
      ...(request.ref_image_weight && { ref_image_weight: request.ref_image_weight }),
    };
    
    // Only add model_name if explicitly specified and not v2
    if (request.model_name && request.model_name !== 'kling-v2') {
      body.model_name = request.model_name;
    }

    try {
      const response = await this.axiosInstance.post(path, body);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async generateImageToVideo(request: VideoGenerationRequest): Promise<{ task_id: string }> {
    const path = '/v1/videos/image2video';
    
    if (!request.image_url) {
      throw new Error('image_url is required for image-to-video generation');
    }

    const body: any = {
      image: request.image_url, // API uses 'image' not 'image_url'
      prompt: request.prompt,
      negative_prompt: request.negative_prompt || '',
      cfg_scale: request.cfg_scale || 0.8,
      duration: request.duration || '5',
      aspect_ratio: request.aspect_ratio || '16:9',
    };
    
    // Only add model_name if explicitly specified and not v2
    if (request.model_name && request.model_name !== 'kling-v2') {
      body.model_name = request.model_name;
    }

    try {
      const response = await this.axiosInstance.post(path, body);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const path = `/v1/videos/text2video/${taskId}`;

    try {
      const response = await this.axiosInstance.get(path);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async extendVideo(request: VideoExtensionRequest): Promise<{ task_id: string }> {
    const path = '/v1/video/extension';
    
    const body: any = {
      task_id: request.task_id,
      prompt: request.prompt,
      duration: request.duration || '5',
      mode: request.mode || 'standard',
    };
    
    // Only add model_name if explicitly specified and not v2
    if (request.model_name && request.model_name !== 'kling-v2') {
      body.model_name = request.model_name;
    }

    try {
      const response = await this.axiosInstance.post(path, body);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async createLipsync(request: LipsyncRequest): Promise<{ task_id: string }> {
    const path = '/v1/videos/lip-sync';
    
    const input: any = {
      video_url: request.video_url,
    };

    if (request.audio_url) {
      input.mode = 'audio2video';
      input.audio_type = 'url';
      input.audio_url = request.audio_url;
    } else if (request.tts_text) {
      input.mode = 'text2video';
      input.text = request.tts_text;
      input.voice_id = request.tts_voice || 'male-magnetic';
      input.voice_language = 'en';
      input.voice_speed = request.tts_speed || 1.0;
    } else {
      throw new Error('Either audio_url or tts_text must be provided');
    }

    const body = { input };

    try {
      const response = await this.axiosInstance.post(path, body);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async downloadVideo(videoUrl: string, downloadPath?: string): Promise<string> {
    const defaultPath = path.join(homedir(), 'Desktop');
    const downloadDir = downloadPath || defaultPath;
    
    // Create directory if it doesn't exist
    await fs.mkdir(downloadDir, { recursive: true });
    
    // Generate filename from URL and timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `kling-video-${timestamp}.mp4`;
    const filepath = path.join(downloadDir, filename);
    
    // Download the video
    const response = await axios.get(videoUrl, {
      responseType: 'stream',
    });
    
    const writer = createWriteStream(filepath);
    response.data.pipe(writer);
    
    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(filepath));
      writer.on('error', reject);
    });
  }

  async applyVideoEffect(request: VideoEffectsRequest): Promise<{ task_id: string }> {
    const path = '/v1/videos/effects';
    
    // Validate image count based on effect type
    const dualCharacterEffects = ['hug', 'kiss', 'heart_gesture'];
    const singleImageEffects = ['squish', 'expansion', 'fuzzyfuzzy', 'bloombloom', 'dizzydizzy'];
    
    if (dualCharacterEffects.includes(request.effect_scene) && request.image_urls.length !== 2) {
      throw new Error(`Effect "${request.effect_scene}" requires exactly 2 images`);
    }
    
    if (singleImageEffects.includes(request.effect_scene) && request.image_urls.length !== 1) {
      throw new Error(`Effect "${request.effect_scene}" requires exactly 1 image`);
    }
    
    const body: any = {
      input: {
        image_urls: request.image_urls,
        effect_scene: request.effect_scene,
        duration: request.duration || '5',
      }
    };
    
    // Only add model_name if explicitly specified and not v2
    if (request.model_name && request.model_name !== 'kling-v2') {
      body.input.model_name = request.model_name;
    }

    try {
      const response = await this.axiosInstance.post(path, body);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async generateImage(request: ImageGenerationRequest): Promise<{ task_id: string }> {
    const path = '/v1/images/generation';
    
    const body: any = {
      prompt: request.prompt,
      negative_prompt: request.negative_prompt || '',
      aspect_ratio: request.aspect_ratio || '1:1',
      num_images: request.num_images || 1,
      ...(request.ref_image_url && { ref_image_url: request.ref_image_url }),
      ...(request.ref_image_weight && { ref_image_weight: request.ref_image_weight }),
    };
    
    // Only add model_name if explicitly specified and not v2
    if (request.model_name && request.model_name !== 'kling-v2') {
      body.model_name = request.model_name;
    }

    try {
      const response = await this.axiosInstance.post(path, body);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getImageTaskStatus(taskId: string): Promise<any> {
    const path = `/v1/image/generation/${taskId}`;

    try {
      const response = await this.axiosInstance.get(path);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async virtualTryOn(request: VirtualTryOnRequest): Promise<{ task_id: string }> {
    const path = '/v1/virtual-try-on';
    
    if (request.cloth_image_urls.length === 0) {
      throw new Error('At least one clothing image URL is required');
    }
    
    if (request.cloth_image_urls.length > 5) {
      throw new Error('Maximum 5 clothing items allowed per request');
    }
    
    const body = {
      model_name: request.model_name || 'kolors-virtual-try-on-v1.5',
      person_image_url: request.person_image_url,
      cloth_image_urls: request.cloth_image_urls,
    };

    try {
      const response = await this.axiosInstance.post(path, body);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getResourcePackages(): Promise<ResourcePackage[]> {
    const path = '/v1/account/packages';

    try {
      const response = await this.axiosInstance.get(path);
      return response.data.data.resource_packages || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async getAccountBalance(): Promise<AccountBalance> {
    const path = '/v1/account/balance';

    try {
      const response = await this.axiosInstance.get(path);
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }

  async listTasks(params?: TaskListParams): Promise<any> {
    const path = '/v1/task/list';
    
    const queryParams = {
      page: params?.page || 1,
      page_size: params?.page_size || 10,
      ...(params?.status && { status: params.status }),
      ...(params?.start_time && { start_time: params.start_time }),
      ...(params?.end_time && { end_time: params.end_time }),
    };

    try {
      const response = await this.axiosInstance.get(path, { params: queryParams });
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}