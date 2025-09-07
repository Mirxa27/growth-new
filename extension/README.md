# Growth Echo Assistant Extension

Load unpacked in chrome://extensions and select this folder. Configure your OpenAI API key in the Options page.

Files:
- manifest.json (MV3)
- background.js (module) – handles OpenAI requests
- content.js (classic script) – injects small overlay and talks to background
- options.html + options.js – configure API key and base URL
- realtime.js – helper to create voice sessions with required session.type
- utils.js – storage helpers

