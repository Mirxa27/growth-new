# Growth Echo Assistant Chrome Extension

A Chrome extension that integrates with the Newomen platform to provide AI-powered assistance using OpenAI keys stored in Supabase.

## Setup Instructions

1. **Load Extension**: Load unpacked in chrome://extensions and select this folder
2. **Configure Supabase**: Open the extension options page and configure:
   - Supabase URL: Your Supabase project URL (e.g., `https://your-project.supabase.co`)
   - Supabase Anon Key: Your Supabase anonymous/public key
   - Enable "Use OpenAI API key from Supabase" (recommended)
3. **Test Connection**: Use the "Test Supabase" button to verify connectivity
4. **Test OpenAI**: Use the "Test OpenAI" button to verify API access

## Features

- **Supabase Integration**: Automatically fetches OpenAI API keys from your Supabase database
- **Fallback Support**: Can use local API keys as backup
- **Error Handling**: Comprehensive error handling for connection issues
- **Mobile-Friendly Options**: Responsive options page

## Files

- `manifest.json` – Chrome extension configuration (MV3)
- `background.js` – Service worker with OpenAI API integration and Supabase support
- `content.js` – Minimal page overlay with health status indicator
- `options.html` + `options.js` – Configuration interface with Supabase integration
- `utils.js` – Shared settings helpers and Supabase API functions
- `realtime.js` – Helper for voice sessions
- `test-supabase.js` – Test suite for validating the integration

## Testing

Run the test suite by loading `test-supabase.js` in the browser console on the options page:

```javascript
// Copy and paste the contents of test-supabase.js into the console
```

## Troubleshooting

- **"Supabase credentials not configured"**: Set your Supabase URL and anon key in options
- **"No active OpenAI provider found"**: Ensure you have an active OpenAI provider configured in your Supabase admin panel
- **"Frame does not exist"**: Normal behavior when tabs are closed; errors are handled gracefully
- **Import errors**: Ensure all files are properly loaded as web accessible resources

## Security

- API keys are fetched securely from Supabase using row-level security
- Local storage is only used as fallback
- All connections use HTTPS