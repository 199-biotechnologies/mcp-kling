import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import mime from 'mime-types';

const SUPABASE_URL = 'https://gmxpycjvoynnavfmrocd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdteHB5Y2p2b3lubmF2Zm1yb2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE1NzI4OTgsImV4cCI6MjA1NzE0ODg5OH0.iBqMrGd1HDWtdiU1JLbRcaCKIbxC3aGo3OTyFENSaFE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function uploadFileToSupabase(filePath: string): Promise<string> {
  // Check if it's already a URL
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Check if it's a local file URL
  if (filePath.startsWith('file://')) {
    filePath = filePath.replace('file://', '');
  }

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Get file info
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';

  // Generate unique file name to avoid conflicts
  const timestamp = Date.now();
  const uniqueFileName = `${timestamp}-${fileName}`;

  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from('kling-temp-files')
    .upload(uniqueFileName, fileBuffer, {
      contentType: mimeType,
      upsert: false
    });

  if (error) {
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('kling-temp-files')
    .getPublicUrl(uniqueFileName);

  return publicUrl;
}

export async function uploadFromUrl(imageUrl: string): Promise<string> {
  // If it's already an HTTP(S) URL, check if it's accessible
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    try {
      // Try to access the URL
      await axios.head(imageUrl);
      return imageUrl; // URL is accessible, use it directly
    } catch (error) {
      // URL is not accessible, might be behind auth or CORS
      // Download and re-upload to Supabase
      try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        const contentType = response.headers['content-type'] || 'image/png';
        const extension = mime.extension(contentType) || 'png';
        const fileName = `downloaded-${Date.now()}.${extension}`;

        const { data, error } = await supabase.storage
          .from('kling-temp-files')
          .upload(fileName, buffer, {
            contentType,
            upsert: false
          });

        if (error) {
          throw new Error(`Failed to upload downloaded file: ${error.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('kling-temp-files')
          .getPublicUrl(fileName);

        return publicUrl;
      } catch (downloadError) {
        // If download fails, return original URL and let Kling API handle it
        return imageUrl;
      }
    }
  }

  // For file:// URLs or local paths, upload to Supabase
  return uploadFileToSupabase(imageUrl);
}