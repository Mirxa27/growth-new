# NewMe Memory Highlights

NewMe now maintains a compact, user-specific memory bank containing:

- Preferences: critical likes/dislikes, tone/speed preferences, modalities
- Themes: recurring topics, goals, challenges, identities
- Context: durable facts that stay relevant across sessions

Implementation overview:

- Database: `public.user_memory_highlights (user_id, highlights JSONB)` with RLS for per-user access.
- Edge Function: `memory-highlights` exposes actions: `get`, `upsert`, `update_from_turn`.
- Chat Functions: `chat-completion` and `enhanced-chat-completion` fetch and inject highlights into system prompts and update memory after each turn.
- Voice: `get-realtime-token` returns `meta.memory` and `meta.instructions` with highlights embedded. `RealtimeVoiceAgent` uses these instructions and updates memory after each assistant response.

Behavior:

- Max 5 items per list; deduplicated and concise.
- Highlights are used implicitly by prompts; they are not echoed to the user.
- Both voice and chat share the same memory for seamless context switching.

Env requirements:

- `OPENAI_API_KEY` for memory extraction (chat and voice updates).

