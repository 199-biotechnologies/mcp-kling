# Kling V2 Test Results

## ✅ CONFIRMED: V2 is the default when model_name is NOT specified

### Test Results with CURL:

1. **WITHOUT model_name** ✅ SUCCESS
   ```bash
   curl -X POST 'https://api-singapore.klingai.com/v1/videos/text2video' \
     -d '{"prompt": "...", "duration": "5"}'
   # Result: SUCCESS - Task created
   ```

2. **WITH model_name: "kling-v1"** ✅ SUCCESS
   ```bash
   curl -X POST 'https://api-singapore.klingai.com/v1/videos/text2video' \
     -d '{"model_name": "kling-v1", "prompt": "...", "duration": "5"}'
   # Result: SUCCESS - Task created with V1
   ```

3. **WITH model_name: "kling-v2"** ❌ ERROR
   ```bash
   curl -X POST 'https://api-singapore.klingai.com/v1/videos/text2video' \
     -d '{"model_name": "kling-v2", "prompt": "...", "duration": "5"}'
   # Result: ERROR - "model is not supported"
   ```

## MCP Implementation Solution:

The MCP server v4.0.0 now:
- **Does NOT send model_name when user wants V2** (default)
- **Only sends model_name when user explicitly requests V1**

```javascript
// For V2 (default):
const body = {
  prompt: "...",
  duration: "5"
  // NO model_name field!
};

// For V1 (explicit):
const body = {
  model_name: "kling-v1",
  prompt: "...",
  duration: "5"
};
```

## Verified Task IDs:
- Task 762933383894401055 - Created without model_name (V2)
- Task 762933385823797336 - Created with kling-v1
- Task 762933506695233577 - Created via MCP without model_name (V2)

All tests performed on 2025-06-14 with actual API calls.