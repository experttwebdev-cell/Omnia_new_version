# AI Provider Configuration Guide

## Overview

The system now supports multiple AI providers with automatic fallback for maximum reliability and cost optimization:

1. **DeepSeek** (Primary - Most Cost-Effective)
2. **OpenAI GPT-3.5-turbo** (Secondary Fallback)
3. **OpenAI GPT-4o-mini** (Last Resort Fallback)

## Cost Comparison

| Provider | Input Cost/M | Output Cost/M | Savings vs GPT-4o-mini |
|----------|--------------|---------------|------------------------|
| **DeepSeek** | $0.014 | $0.028 | **95% cheaper** ✅ |
| **GPT-3.5-turbo** | $0.050 | $0.150 | **73% cheaper** ✅ |
| **GPT-4o-mini** | $0.150 | $0.600 | Baseline |

### Monthly Cost Estimates (500 token avg per message)

| Messages/Day | DeepSeek | GPT-3.5-turbo | GPT-4o-mini |
|--------------|----------|---------------|-------------|
| 10 | $0.06/mo | $0.30/mo | $1.14/mo |
| 50 | $0.32/mo | $1.50/mo | $5.70/mo |
| 100 | $0.63/mo | $3.00/mo | $11.40/mo |
| 500 | $3.15/mo | $15.00/mo | $57.00/mo |
| 1000 | $6.30/mo | $30.00/mo | $114.00/mo |

## How It Works

The system implements an **automatic failover mechanism**:

1. Every AI request first tries **DeepSeek** (most cost-effective)
2. If DeepSeek fails (quota exceeded, API error, not configured), it automatically tries **GPT-3.5-turbo**
3. If GPT-3.5-turbo fails, it falls back to **GPT-4o-mini** as last resort
4. If all providers fail, the user receives a friendly error message

### Error Handling

The system handles these scenarios automatically:
- ✅ **401 Unauthorized**: Invalid API key → tries next provider
- ✅ **429 Rate Limit**: Quota exceeded → tries next provider
- ✅ **403 Forbidden**: Access denied → tries next provider
- ✅ **Empty Response**: No content returned → tries next provider
- ✅ **Network Errors**: Connection issues → tries next provider

## Configuration

### Step 1: Get a DeepSeek API Key (Recommended)

1. Visit [https://platform.deepseek.com](https://platform.deepseek.com)
2. Sign up for a free account
3. Navigate to **API Keys** section
4. Create a new API key
5. Copy your API key (starts with `sk-`)

### Step 2: Configure Supabase Secrets

The edge function uses Supabase's environment variables (automatically configured):

```bash
DEEPSEEK_API_KEY=sk-your-deepseek-key-here
OPENAI_API_KEY=sk-your-openai-key-here
```

### Step 3: Update Local Environment (Optional)

For local testing, add to your `.env` file:

```bash
DEEPSEEK_API_KEY=sk-your-deepseek-key-here
```

## Testing

### Method 1: Using the Test Page

1. Open `test-api-connections.html` in your browser
2. The page will show which providers are configured
3. Click **Test Direct DeepSeek** to test DeepSeek API
4. Click **Test Multi-Provider Fallback** to test the entire fallback system

### Method 2: Using the Settings UI

1. Navigate to **Settings** in the app
2. Scroll to the **AI Provider Configuration** section
3. View the status of each provider (Configured / Not configured)
4. Click **Test** on any provider to verify connectivity
5. View monthly cost estimates based on usage

### Method 3: Using the AI Chat

1. Open the **AI Chat** tab
2. Send a message like "canapé scandinave"
3. Check the browser console to see which provider was used
4. Look for logs like:
   ```
   🔄 Trying deepseek with model deepseek-chat...
   ✅ Success with deepseek
   ```

## Monitoring & Logs

### Edge Function Logs

Check Supabase edge function logs to see provider usage:

```
🔄 Trying deepseek with model deepseek-chat...
✅ Success with deepseek
```

Or if fallback is triggered:

```
❌ deepseek API error: 429
🔄 Trying openai-3.5 with model gpt-3.5-turbo...
✅ Success with openai-3.5
```

### Browser Console

The frontend also logs AI operations in the browser console:

```javascript
🚀 [OMNIA] Starting OmnIAChat for message: canapé scandinave
🎯 [OMNIA] Step 1: Detecting intent...
✅ [OMNIA] Intent detected: ProductSearchIntent in 45ms
🔍 [OMNIA] Step 2: Extracting product attributes...
✅ [OMNIA] Attributes extracted in 12ms
📦 [OMNIA] Step 3: Searching products...
✅ [OMNIA] Found 5 products in 234ms
💬 [OMNIA] Step 4: Generating presentation...
🏁 [OMNIA] Total OmnIAChat time: 1240ms
```

## Troubleshooting

### Issue: "All AI providers are unavailable"

**Cause**: None of the configured providers can respond

**Solution**:
1. Check that at least one API key is configured in Supabase secrets
2. Verify API keys are valid (not expired or revoked)
3. Check if you've exceeded quota on all providers
4. View edge function logs for detailed error messages

### Issue: DeepSeek returns authentication error

**Cause**: Invalid or expired DeepSeek API key

**Solution**:
1. Verify your API key at [https://platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys)
2. Generate a new API key if needed
3. Update the `DEEPSEEK_API_KEY` in Supabase secrets
4. Redeploy the edge function

### Issue: OpenAI returns quota exceeded (429)

**Cause**: OpenAI quota/rate limit reached

**Solution**:
1. **Immediate**: The system will automatically use DeepSeek if configured
2. **Long-term**: Configure DeepSeek to reduce OpenAI usage by 95%
3. Add billing/increase quota at [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)

### Issue: High AI costs

**Solution**:
1. Configure **DeepSeek** as primary provider (95% cost reduction)
2. Monitor usage in the Settings → AI Provider Configuration section
3. Review monthly cost estimates for your usage level
4. Consider implementing rate limiting for high-traffic applications

## Best Practices

### 1. Always Configure DeepSeek

Configure DeepSeek even if you have OpenAI credits. Benefits:
- 95% cost savings
- Automatic fallback if OpenAI fails
- Better performance in some cases

### 2. Monitor Provider Usage

Regularly check:
- Which provider is being used most
- Any patterns of fallback triggers
- Monthly cost trends

### 3. Keep Both Providers Active

Even though DeepSeek is cheaper, keep OpenAI configured:
- Provides redundancy
- Ensures high availability
- Allows graceful degradation

### 4. Test Regularly

Use the test tools to verify:
- API keys are valid
- Fallback mechanism works
- Response quality is acceptable

## Architecture

### Edge Function: `ai-chat`

Location: `supabase/functions/ai-chat/index.ts`

Key features:
- ✅ Automatic provider selection
- ✅ Graceful fallback on errors
- ✅ Detailed logging
- ✅ Cost optimization
- ✅ Error handling

### Frontend Integration

The frontend calls the edge function via:

```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/ai-chat`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: userMessage,
    storeId: storeId
  })
});
```

The edge function handles all provider logic internally - the frontend doesn't need to know which provider is used.

## Support

For issues or questions:
1. Check the browser console for client-side errors
2. Check Supabase edge function logs for server-side errors
3. Use the test pages to isolate the issue
4. Verify API keys are correctly configured

## Future Enhancements

Potential improvements:
- [ ] Add usage analytics per provider
- [ ] Implement cost alerts
- [ ] Add more AI providers (Claude, Mistral, etc.)
- [ ] Provider preference configuration in UI
- [ ] Historical cost tracking
- [ ] A/B testing different providers for quality
