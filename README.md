# Realtime Voice Agent

This project implements a realtime voice agent using OpenAI's GPT-realtime model. It includes a React+TypeScript admin panel for configuration and a secure server for minting ephemeral tokens.

## Features

- Realtime voice interaction with OpenAI's GPT-realtime model
- Low-latency audio capture using WebRTC
- Streaming speech recognition and incremental responses
- Synthesized audio playback
- Secure ephemeral token flow brokered by Supabase
- React+TypeScript admin panel for runtime configuration and observability
- Hardened token issuance serverless function
- Database migrations
- CI/CD with Vercel
- Unit, integration, and E2E tests
- Structured logging and metrics

## Getting Started

### Prerequisites

- Node.js
- npm
- A Supabase project
- An OpenAI API key
- A Vercel account

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/realtime-voice-agent.git
    cd realtime-voice-agent
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Create a `.env` file** in the root of the project and add the following environment variables:

    ```
    SUPABASE_URL=your_supabase_url
    SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    OPENAI_API_KEY=your_openai_api_key
    ```

### Database Migrations

To apply the database migrations, you can either use the Supabase CLI or run the SQL files directly in the Supabase Studio.

### Running the Development Server

To start the development server, run the following command:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Deployment

This project is configured for continuous deployment to Vercel. To deploy, you will need to set up a new project on Vercel and configure the following environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`

## CI/CD

This project uses GitHub Actions to run tests and deploy to Vercel. The workflow is defined in `.github/workflows/vercel-deploy.yml`.

## Troubleshooting

- **"No client secret received from OpenAI"**: This error indicates that the `get-realtime-token` edge function is unable to get a token from OpenAI. Check that your OpenAI API key is correct and that you have sufficient credits.
- **Controlled/uncontrolled input warnings**: These warnings occur when a React component's input value is `undefined`. The `Input` and `Textarea` components have been updated to handle this, but you may still see warnings in some cases.

## Prioritized Roadmap

- [ ] Implement WebSocket fallback for browsers that do not support WebRTC
- [ ] Add support for more voice agents (e.g., ElevenLabs)
- [ ] Implement a more sophisticated audit log
- [ ] Add more detailed metrics and observability