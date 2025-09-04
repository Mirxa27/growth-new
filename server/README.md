# Voice Agent Server

This server provides an endpoint to securely mint ephemeral tokens for the OpenAI Realtime Voice Agent.

## Prerequisites

- Node.js
- npm
- A Supabase project
- An OpenAI API key

## Setup

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Create a `.env` file** in the root of the project and add the following environment variables:

    ```
    SUPABASE_URL=your_supabase_url
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    OPENAI_API_KEY=your_openai_api_key
    ```

## Running the server

To start the server, run the following command:

```bash
npx ts-node server/voice-agent-server-node.ts
```

The server will start on port 8000.