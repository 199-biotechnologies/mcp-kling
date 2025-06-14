import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

export interface VideoGenerationRequest {
  prompt: string;
  negative_prompt?: string;
  model_name?: 'kling-v1' | 'kling-v1.5' | 'kling-v1.6';
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

export default class KlingClient {
  private accessKey: string;
  private secretKey: string;
  private axiosInstance: AxiosInstance;

  constructor(accessKey: string, secretKey: string) {
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.axiosInstance = axios.create({
      baseURL: 'https://api-singapore.klingai.com',
      timeout: 30000,
    });
  }

  private generateSignature(method: string, path: string, timestamp: string, body?: any): string {
    const contentToSign = `${method}\n${path}\n${timestamp}\n${body ? JSON.stringify(body) : ''}`;
    const hmac = crypto.createHmac('sha256', this.secretKey);
    hmac.update(contentToSign);
    return hmac.digest('base64');
  }

  private getHeaders(method: string, path: string, body?: any) {
    const timestamp = new Date().toISOString();
    const signature = this.generateSignature(method, path, timestamp, body);
    
    return {
      'X-Kling-Access-Key': this.accessKey,
      'X-Kling-Signature': signature,
      'X-Kling-Timestamp': timestamp,
      'Content-Type': 'application/json',
    };
  }

  async generateVideo(request: VideoGenerationRequest): Promise<{ task_id: string }> {
    const path = '/v1/videos/text2video';
    const method = 'POST';
    
    const body = {
      model_name: request.model_name || 'kling-v1.6',
      prompt: request.prompt,
      negative_prompt: request.negative_prompt || '',
      cfg_scale: request.cfg_scale || 0.5,
      mode: request.mode || 'standard',
      aspect_ratio: request.aspect_ratio || '16:9',
      duration: request.duration || '5',
      ...(request.image_url && { image_url: request.image_url }),
      ...(request.image_tail_url && { image_tail_url: request.image_tail_url }),
      ...(request.ref_image_url && { ref_image_url: request.ref_image_url }),
      ...(request.ref_image_weight && { ref_image_weight: request.ref_image_weight }),
    };

    try {
      const response = await this.axiosInstance.post(path, body, {
        headers: this.getHeaders(method, path, body),
      });
      
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
    const method = 'POST';
    
    if (!request.image_url) {
      throw new Error('image_url is required for image-to-video generation');
    }

    const body = {
      model_name: request.model_name || 'kling-v1.5',
      image_url: request.image_url,
      image_tail_url: request.image_tail_url,
      prompt: request.prompt,
      negative_prompt: request.negative_prompt || '',
      cfg_scale: request.cfg_scale || 0.5,
      mode: request.mode || 'standard',
      duration: request.duration || '5',
    };

    try {
      const response = await this.axiosInstance.post(path, body, {
        headers: this.getHeaders(method, path, body),
      });
      
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
    const method = 'GET';

    try {
      const response = await this.axiosInstance.get(path, {
        headers: this.getHeaders(method, path),
      });
      
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
      }
      throw error;
    }
  }
}