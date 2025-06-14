#!/bin/bash

ACCESS_KEY="AnG8dFHyyyJ33trBEGKTmAKgfR4EFQJ8"
SECRET_KEY="9YGL3FCdnmrbCfnyDKPD3HCnteRaTLDC"
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
METHOD="POST"
PATH="/v1/videos/text2video"
BODY='{"model_name":"kling-v1.6","prompt":"A beautiful sunset over the ocean","negative_prompt":"","cfg_scale":0.5,"mode":"standard","aspect_ratio":"16:9","duration":"5"}'

# Create signature
STRING_TO_SIGN="${METHOD}
${PATH}
${TIMESTAMP}
${BODY}"

SIGNATURE=$(echo -n "$STRING_TO_SIGN" | openssl dgst -sha256 -hmac "$SECRET_KEY" -binary | base64)

echo "Testing Kling API..."
echo "Timestamp: $TIMESTAMP"
echo "Signature: $SIGNATURE"
echo ""

curl -X POST https://api-singapore.klingai.com/v1/videos/text2video \
  -H "Content-Type: application/json" \
  -H "X-Kling-Access-Key: $ACCESS_KEY" \
  -H "X-Kling-Signature: $SIGNATURE" \
  -H "X-Kling-Timestamp: $TIMESTAMP" \
  -d "$BODY" \
  -w "\n\nHTTP Status: %{http_code}\n"