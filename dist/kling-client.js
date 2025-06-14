import axios from 'axios';
import { promises as fs } from 'fs';
import { createWriteStream } from 'fs';
import path from 'path';
import { homedir } from 'os';
export default class KlingClient {
    jwt;
    axiosInstance;
    constructor(jwt) {
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
    async generateVideo(request) {
        const path = '/v1/videos/text2video';
        const body = {
            prompt: request.prompt,
            negative_prompt: request.negative_prompt || '',
            cfg_scale: request.cfg_scale || 0.8,
            aspect_ratio: request.aspect_ratio || '16:9',
            duration: request.duration || '5',
            model_name: request.model_name || 'kling-v2-master', // V2-master is default
            ...(request.image_url && { image_url: request.image_url }),
            ...(request.image_tail_url && { image_tail_url: request.image_tail_url }),
            ...(request.ref_image_url && { ref_image_url: request.ref_image_url }),
            ...(request.ref_image_weight && { ref_image_weight: request.ref_image_weight }),
            ...(request.camera_control && { camera_control: request.camera_control }),
            ...(request.callback_url && { callback_url: request.callback_url }),
            ...(request.external_task_id && { external_task_id: request.external_task_id }),
        };
        try {
            const response = await this.axiosInstance.post(path, body);
            return response.data.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async generateImageToVideo(request) {
        const path = '/v1/videos/image2video';
        if (!request.image_url) {
            throw new Error('image_url is required for image-to-video generation');
        }
        const body = {
            image: request.image_url, // API uses 'image' not 'image_url'
            prompt: request.prompt,
            negative_prompt: request.negative_prompt || '',
            cfg_scale: request.cfg_scale || 0.8,
            duration: request.duration || '5',
            aspect_ratio: request.aspect_ratio || '16:9',
            model_name: request.model_name || 'kling-v2-master', // V2-master is default
        };
        try {
            const response = await this.axiosInstance.post(path, body);
            return response.data.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async getTaskStatus(taskId) {
        const path = `/v1/videos/text2video/${taskId}`;
        try {
            const response = await this.axiosInstance.get(path);
            return response.data.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async extendVideo(request) {
        const path = '/v1/video/extension';
        const body = {
            task_id: request.task_id,
            prompt: request.prompt,
            duration: request.duration || '5',
            mode: request.mode || 'standard',
            model_name: request.model_name || 'kling-v2-master', // V2-master is default
        };
        try {
            const response = await this.axiosInstance.post(path, body);
            return response.data.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async createLipsync(request) {
        const path = '/v1/videos/lip-sync';
        const input = {
            video_url: request.video_url,
        };
        if (request.audio_url) {
            input.mode = 'audio2video';
            input.audio_type = 'url';
            input.audio_url = request.audio_url;
        }
        else if (request.tts_text) {
            input.mode = 'text2video';
            input.text = request.tts_text;
            input.voice_id = request.tts_voice || 'male-magnetic';
            input.voice_language = 'en';
            input.voice_speed = request.tts_speed || 1.0;
        }
        else {
            throw new Error('Either audio_url or tts_text must be provided');
        }
        const body = { input };
        try {
            const response = await this.axiosInstance.post(path, body);
            return response.data.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async downloadVideo(videoUrl, downloadPath) {
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
    async applyVideoEffect(request) {
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
        const body = {
            input: {
                image_urls: request.image_urls,
                effect_scene: request.effect_scene,
                duration: request.duration || '5',
            }
        };
        // Always add model_name
        body.input.model_name = request.model_name || 'kling-v2-master';
        try {
            const response = await this.axiosInstance.post(path, body);
            return response.data.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async generateImage(request) {
        const path = '/v1/images/generation';
        const body = {
            prompt: request.prompt,
            negative_prompt: request.negative_prompt || '',
            aspect_ratio: request.aspect_ratio || '1:1',
            num_images: request.num_images || 1,
            ...(request.ref_image_url && { ref_image_url: request.ref_image_url }),
            ...(request.ref_image_weight && { ref_image_weight: request.ref_image_weight }),
        };
        // Always add model_name
        body.model_name = request.model_name || 'kling-v2-master';
        try {
            const response = await this.axiosInstance.post(path, body);
            return response.data.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async getImageTaskStatus(taskId) {
        const path = `/v1/image/generation/${taskId}`;
        try {
            const response = await this.axiosInstance.get(path);
            return response.data.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async virtualTryOn(request) {
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
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async getResourcePackages() {
        const path = '/v1/account/packages';
        try {
            const response = await this.axiosInstance.get(path);
            return response.data.data.resource_packages || [];
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async getAccountBalance() {
        const path = '/v1/account/balance';
        try {
            const response = await this.axiosInstance.get(path);
            return response.data.data;
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
    async listTasks(params) {
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
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`Kling API error: ${error.response?.data?.message || error.message}`);
            }
            throw error;
        }
    }
}
