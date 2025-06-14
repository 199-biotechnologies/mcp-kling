#!/usr/bin/env node
import crypto from 'crypto';

const KLING_ACCESS_KEY = 'AnG8dFHyyyJ33trBEGKTmAKgfR4EFQJ8';
const KLING_SECRET_KEY = '9YGL3FCdnmrbCfnyDKPD3HCnteRaTLDC';

// Manual JWT generation without external dependencies
function base64urlEscape(str) {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function sign(message, secret) {
  return base64urlEscape(crypto.createHmac('sha256', secret).update(message).digest('base64'));
}

const currentTime = Math.floor(Date.now() / 1000);
const header = {
  alg: 'HS256',
  typ: 'JWT'
};

const payload = {
  iss: KLING_ACCESS_KEY,
  exp: currentTime + 1800, // 30 minutes
  nbf: currentTime - 5     // Valid from 5 seconds ago
};

const encodedHeader = base64urlEscape(Buffer.from(JSON.stringify(header)).toString('base64'));
const encodedPayload = base64urlEscape(Buffer.from(JSON.stringify(payload)).toString('base64'));
const signature = sign(encodedHeader + '.' + encodedPayload, KLING_SECRET_KEY);

const jwt = encodedHeader + '.' + encodedPayload + '.' + signature;
console.log(jwt);