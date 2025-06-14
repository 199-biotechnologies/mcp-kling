import axios from 'axios';
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
}
