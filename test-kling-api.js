import crypto from 'crypto';
import https from 'https';

const ACCESS_KEY = 'AnG8dFHyyyJ33trBEGKTmAKgfR4EFQJ8';
const SECRET_KEY = '9YGL3FCdnmrbCfnyDKPD3HCnteRaTLDC';

function generateSignature(method, path, timestamp, body) {
  const contentToSign = `${method}\n${path}\n${timestamp}\n${JSON.stringify(body)}`;
  const hmac = crypto.createHmac('sha256', SECRET_KEY);
  hmac.update(contentToSign);
  return hmac.digest('base64');
}

function testKlingAPI() {
  const timestamp = new Date().toISOString();
  const path = '/v1/videos/text2video';
  const method = 'POST';
  
  const body = {
    model_name: 'kling-v1.6',
    prompt: 'A beautiful sunset over the ocean with waves',
    negative_prompt: '',
    cfg_scale: 0.5,
    mode: 'standard',
    aspect_ratio: '16:9',
    duration: '5'
  };

  const signature = generateSignature(method, path, timestamp, body);
  
  console.log('Testing Kling API...');
  console.log('Timestamp:', timestamp);
  console.log('Signature:', signature);
  console.log('Body:', JSON.stringify(body, null, 2));

  const options = {
    hostname: 'api-singapore.klingai.com',
    port: 443,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'X-Kling-Access-Key': ACCESS_KEY,
      'X-Kling-Signature': signature,
      'X-Kling-Timestamp': timestamp,
      'Content-Length': Buffer.byteLength(JSON.stringify(body))
    }
  };

  const req = https.request(options, (res) => {
    console.log('\nStatus Code:', res.statusCode);
    console.log('Headers:', res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('\nResponse:', data);
      try {
        const parsed = JSON.parse(data);
        console.log('\nParsed Response:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Failed to parse response');
      }
    });
  });

  req.on('error', (e) => {
    console.error('Error:', e);
  });

  req.write(JSON.stringify(body));
  req.end();
}

testKlingAPI();