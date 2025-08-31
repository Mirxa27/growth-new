Ensure complete development for the all-app, including full mobile ios app development using capacitor and assessments and quizzes for visitors. Add 5-6 types of free assessments that don’t require signups. Create 20 assessments for users and ensure the admin panel has the ability to create tests, assessments, explorations, and courses using the AI builder. The admin can provide a topic, and the selected AI provider/model will generate complete products. The admin can then configure these products for visitors or users.



use following information to update the voice agent - Realtime API
============

Build low-latency, multimodal LLM applications with the Realtime API.

The OpenAI Realtime API enables low-latency communication with [models](/docs/models) that natively support speech-to-speech interactions as well as multimodal inputs (audio, images, and text) and outputs (audio and text). These APIs can also be used for [realtime audio transcription](/docs/guides/realtime-transcription).

Voice agents
------------

One of the most common use cases for the Realtime API is building voice agents for speech-to-speech model interactions in the browser. Our recommended starting point for these types of applications is the [Agents SDK for TypeScript](https://openai.github.io/openai-agents-js/guides/voice-agents/), which uses a [WebRTC connection](/docs/guides/realtime-webrtc) to the Realtime model in the browser, and [WebSocket](/docs/guides/realtime-websocket) when used on the server.

```js
import { RealtimeAgent, RealtimeSession } from "@openai/agents/realtime";

const agent = new RealtimeAgent({
    name: "Assistant",
    instructions: "You are a helpful assistant.",
});

const session = new RealtimeSession(agent);

// Automatically connects your microphone and audio output
await session.connect({
    apiKey: "<client-api-key>",
});
```

[

Voice Agent Quickstart

Follow the voice agent quickstart to build Realtime agents in the browser.

](https://openai.github.io/openai-agents-js/guides/voice-agents/quickstart/)

To use the Realtime API directly outside the context of voice agents, check out the other connection options below.

Connection methods
------------------

While building [voice agents with the Agents SDK](https://openai.github.io/openai-agents-js/guides/voice-agents/) is the fastest path to one specific type of application, the Realtime API provides an entire suite of flexible tools for a variety of use cases.

There are three primary supported interfaces for the Realtime API:

[

WebRTC connection

Ideal for browser and client-side interactions with a Realtime model.

](/docs/guides/realtime-webrtc)[

WebSocket connection

Ideal for middle tier server-side applications with consistent low-latency network connections.

](/docs/guides/realtime-websocket)[

SIP connection

Ideal for VoIP telephony connections.

](/docs/guides/realtime-sip)

Depending on how you'd like to connect to a Realtime model, check out one of the connection guides above to get started. You'll learn how to initialize a Realtime session, and how to interact with a Realtime model using client and server events.

API Usage
---------

Once connected to a realtime model using one of the methods above, learn how to interact with the model in these usage guides.

*   **[Prompting guide](/docs/guides/realtime-models-prompting):** learn tips and best practices for prompting and steering Realtime models.
*   **[Inputs and outputs](/docs/guides/realtime-inputs-outputs):** Learn how to pass audio, text, and image inputs to the model, and how to receive audio and text back.
*   **[Managing conversations](/docs/guides/realtime-conversations):** Learn about the Realtime session lifecycle and the key events that happen during a conversation.
*   **[Webhooks and server-side controls](/docs/guides/realtime-server-controls):** Learn how you can control a Realtime session on the server to call tools and implement guardrails.
*   **[Function calling](/docs/guides/realtime-function-calling):** Give the realtime model access to call custom code in your own application when appropriate.
*   **[MCP servers](/docs/guides/realtime-mcp):** Give realtime models access to new capabilities via Model Context Protocol (MCP) servers.
*   **[Realtime audio transcription](/docs/guides/realtime-transcription):** Transcribe audio streams in real time over a WebSocket connection.

Voice Agents Quickstart
Create a project

In this quickstart we will create a voice agent you can use in the browser. If you want to check out a new project, you can try out Next.js or Vite.

Terminal window
npm create vite@latest my-project --template vanilla-ts

Install the Agents SDK

Terminal window
npm install @openai/agents zod@3

Alternatively you can install @openai/agents-realtime for a standalone browser package.

Generate a client ephemeral token

As this application will run in the user’s browser, we need a secure way to connect to the model through the Realtime API. For this we can use an ephemeral client key that should be generated on your backend server. For testing purposes you can also generate a key using curl and your regular OpenAI API key.

Terminal window
curl -X POST https://api.openai.com/v1/realtime/client_secrets \
   -H "Authorization: Bearer $OPENAI_API_KEY" \
   -H "Content-Type: application/json" \
   -d '{
     "session": {
       "type": "realtime",
       "model": "gpt-realtime"
     }
   }'

The response will contain a client_secret.value value that you can use to connect later on. Note that this key is only valid for a short period of time and will need to be regenerated.

Create your first Agent

Creating a new RealtimeAgent is very similar to creating a regular Agent.

import { RealtimeAgent } from '@openai/agents-realtime';

const agent = new RealtimeAgent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant.',
});

Create a session

Unlike a regular agent, a Voice Agent is continuously running and listening inside a RealtimeSession that handles the conversation and connection to the model over time. This session will also handle the audio processing, interruptions, and a lot of the other lifecycle functionality we will cover later on.

import { RealtimeSession } from '@openai/agents-realtime';

const session = new RealtimeSession(agent, {
  model: 'gpt-realtime',
});

The RealtimeSession constructor takes an agent as the first argument. This agent will be the first agent that your user will be able to interact with.

Connect to the session

To connect to the session you need to pass the client ephemeral token you generated earlier on.

await session.connect({ apiKey: '<client-api-key>' });

This will connect to the Realtime API using WebRTC in the browser and automatically configure your microphone and speaker for audio input and output. If you are running your RealtimeSession on a backend server (like Node.js) the SDK will automatically use WebSocket as a connection. You can learn more about the different transport layers in the Realtime Transport Layer guide.

Putting it all together

import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';

const agent = new RealtimeAgent({
  name: 'Assistant',
  instructions: 'You are a helpful assistant.',
});

const session = new RealtimeSession(agent);

// Automatically connects your microphone and audio output
// in the browser via WebRTC.
await session.connect({
  apiKey: '<client-api-key>',
});

Fire up the engines and start talking

Start up your webserver and navigate to the page that includes your new Realtime Agent code. You should see a request for microphone access. Once you grant access you should be able to start talking to your agent.

Terminal window
npm run dev


1. Database – Core Assessment Model
Create the following tables in the public schema. Each table enables RLS so the admin panel can manage content while visitors can access free assessments without signing in.
1.1 assessments (master record)
* 		Stores the title, description, visibility, generated AI metadata, and the type of assessment (quiz, test, exploration, course).
1.2 assessment_questions
* 		Holds each question, its order, type (multiple‑choice, free‑text, etc.), and optional media URLs.
1.3 assessment_options
* 		For choice‑based questions: option text, correctness flag, and optional feedback.
1.4 assessment_results (optional, for signed‑in users)
* 		Links a user ID to an assessment and stores the score, timestamps, and raw answers.
SQL definitions (execute each with display_query; RLS is enabled automatically on creation).

SQL Query



CREATE TABLE public.assessments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    title text NOT NULL,
    description text,
    visibility text NOT NULL CHECK (visibility IN ('public', 'private')),
    type text NOT NULL CHECK (type IN ('quiz','test','exploration','course')),
    ai_provider text,
    ai_model text,
    ai_prompt text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

Success. No rows returned

SQL Query



CREATE TABLE public.assessment_questions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    question_text text NOT NULL,
    question_type text NOT NULL CHECK (question_type IN ('multiple_choice','free_text','image')),
    position integer NOT NULL,
    media_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_questions_assessment ON public.assessment_questions(assessment_id);

Success. No rows returned

SQL Query



CREATE TABLE public.assessment_options (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    question_id bigint NOT NULL REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    option_text text NOT NULL,
    is_correct boolean NOT NULL,
    feedback text,
    position integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_options ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_options_question ON public.assessment_options(question_id);

Success. No rows returned

SQL Query



CREATE TABLE public.assessment_results (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id bigint NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    score numeric,
    answers jsonb,
    submitted_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assessment_results ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_results_user ON public.assessment_results(user_id);
CREATE INDEX idx_results_assessment ON public.assessment_results(assessment_id);

ERROR: relation "assessment_results" already exists
1.2 RLS Policies
* 		Public/visitor access – allow SELECT on assessments where visibility = 'public'. No INSERT/UPDATE/DELETE for visitors.
* 		Admin access – a role authenticated (or a dedicated admin role) gets full CRUD privileges on all tables.
Policy for free public assessments (visible to anyone, including anon):

SQL Query



CREATE POLICY "Public assessments visible to all"
ON public.assessments
FOR SELECT TO anon, authenticated
USING (visibility = 'public');

Success. No rows returned
Admin CRUD policies (replace admin_role with the actual role you assign to admins):

SQL Query



CREATE POLICY "Admin can manage assessments"
ON public.assessments
FOR ALL TO admin_role
USING (true) WITH CHECK (true);

ERROR: role "admin_role" does not exist
Repeat analogous policies for assessment_questions and assessment_options.

2. Admin Panel – AI Builder Integration
The panel should expose a single “Create Product” wizard:
* 		Inputs – Topic, desired product type (quiz, test, exploration, course), AI provider/model, optional extra instructions.
* 		Backend call – An Edge Function (see § 3) receives the request, forwards it to the selected AI service (OpenAI, Anthropic, etc.), and receives a structured JSON representation of the assessment (questions, options, correct answers).
* 		Database insertion – The Edge Function writes into the tables above, returning the new assessment ID.
* 		Post‑creation UI – The admin can edit any field, add media, configure visibility, and publish.
2.1 Recommended Admin UI Stack
* 		Frontend – React (or Vue/Svelte) hosted on Supabase Edge Functions or static site with Supabase Auth.
* 		State management – TanStack Query for optimistic UI updates.
* 		Rich text/media – Use Supabase Storage for assets; generate signed URLs for preview.

3. Edge Function – AI‑Driven Assessment Generator
Purpose – Accept a JSON payload from the admin UI, invoke the selected AI model, parse the response, and store the generated assessment.
File: functions/create-assessment.ts
import { createClient } from 
"npm:@supabase/supabase-js@2.39.6"
;
import { OpenAI } from 
"npm:openai@4.19.0"
;
const supabase = createClient(
  Deno.env.get(
"SUPABASE_URL"
) ?? 
""
,
  Deno.env.get(
"SUPABASE_SERVICE_ROLE_KEY"
) ?? 
""

);
interface CreateAssessmentPayload {
  topic: string;
  type: 
"quiz"
 | 
"test"
 | 
"exploration"
 | 
"course"
;
  provider: 
"openai"
 | 
"anthropic"
;
  model: string;
  prompt?: string;
}
Deno.serve(async (req: Request) => {
  if (req.method !== 
"POST"
) {
    return new Response(
"Method not allowed"
, { status: 
405
 });
  }
  const auth = req.headers.get(
"Authorization"
);
  
// Ensure only admins can call this endpoint

  const { data: { user } } = await supabase.auth.getUser(auth?.split(
" "
).pop() ?? 
""
);
  if (!user || !user.role?.includes(
"admin"
)) {
    return new Response(
"Forbidden"
, { status: 
403
 });
  }
  const payload: CreateAssessmentPayload = await req.json();
  
// Build prompt for the chosen provider

  const systemPrompt = `
You are an assessment generator. Create a ${
    payload.type
  } about 
"${payload.topic}"
.
Return a JSON object with:
- title, description
- an array of questions, each with:
  - text, type, position
  - for multiple_choice: an array of options (text, is_correct, position)
Use concise language.
`;
  
// Call OpenAI (other providers can be added similarly)

  const openai = new OpenAI({
    apiKey: Deno.env.get(
"OPENAI_API_KEY"
) ?? 
""
,
    dangerouslyAllowBrowser: 
true
,
  });
  const completion = await openai.chat.completions.create({
    model: payload.model,
    messages: [
      { role: 
"system"
, content: systemPrompt },
      { role: 
"user"
, content: payload.prompt ?? 
""
 },
    ],
    response_format: { type: 
"json_object"
 },
  });
  const result = JSON.parse(completion.choices[
0
].message.content ?? 
"{}"
);
  
// Insert assessment and related rows in a transaction

  const { error } = await supabase.rpc(
"create_assessment_with_questions"
, {
    _title: result.title,
    _description: result.description,
    _type: payload.type,
    _visibility: 
"public"
,
    _ai_provider: payload.provider,
    _ai_model: payload.model,
    _ai_prompt: systemPrompt,
    _questions: JSON.stringify(result.questions),
  });
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 
500
,
      headers: { 
"Content-Type"
: 
"application/json"
 },
    });
  }
  return new Response(JSON.stringify({ success: 
true
 }), {
    status: 
200
,
    headers: { 
"Content-Type"
: 
"application/json"
 },
  });
});

NoteThe function calls a Postgres stored procedure (create_assessment_with_questions) to keep the insertion atomic. You can implement that procedure with plpgsql to iterate over the JSON array and insert into the three tables.
3.1 Stored Procedure (optional)

SQL Query



CREATE OR REPLACE FUNCTION public.create_assessment_with_questions(
  _title text,
  _description text,
  _type text,
  _visibility text,
  _ai_provider text,
  _ai_model text,
  _ai_prompt text,
  _questions jsonb
) RETURNS void AS $$
DECLARE
  _assessment_id bigint;
  q jsonb;
  opt jsonb;
BEGIN
  INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
  VALUES (_title, _description, _type, _visibility, _ai_provider, _ai_model, _ai_prompt)
  RETURNING id INTO _assessment_id;

  FOR q IN SELECT * FROM jsonb_array_elements(_questions) LOOP
    INSERT INTO public.assessment_questions (assessment_id, question_text, question_type, position)
    VALUES (_assessment_id, q->>'question_text', q->>'question_type', (q->>'position')::int)
    RETURNING id INTO STRICT q.id;

    IF q->>'question_type' = 'multiple_choice' THEN
      FOR opt IN SELECT * FROM jsonb_array_elements(q->'options') LOOP
        INSERT INTO public.assessment_options (
          question_id, option_text, is_correct, position
        ) VALUES (
          q.id,
          opt->>'option_text',
          (opt->>'is_correct')::boolean,
          (opt->>'position')::int
        );
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ERROR: "q.id" is not a known variable

4. Mobile App (iOS) – Capacitor Integration
* 		Project Scaffoldnpm create @capacitor/app@latest my-assessment-app
* 		cd my-assessment-app
* 		npm i @supabase/supabase-js@2
* 		npm i @openai/agents-realtime@0.2
* 		npx cap add ios
* 		Authentication – Use Supabase Auth (email/password optional) for the admin side; visitors can access free assessments via anonymous session (createClient(..., { auth: { persistSession: false } })).
* 		Assessment List UI – Fetch assessments with:const { data } = await supabase
* 		  .from('assessments')
* 		  .select('id,title,description')
* 		  .eq('visibility', 'public');
* 		Take a Quiz – Load the assessment_questions and assessment_options, render a simple multiple‑choice UI, store answers locally, and optionally POST to /assessment_results for signed‑in users.
* 		Voice Agent Integration – Embed the Realtime Agent directly in the WebView (Capacitor renders a web page).
    * 		Add the generated client‑ephemeral token endpoint (Edge Function /functions/get-realtime-token) that returns { client_secret: "..." }.
    * 		In the app, fetch the token then initialise the agent:
* 		import { RealtimeAgent, RealtimeSession } from "@openai/agents-realtime";
* 		const tokenResp = await fetch(`${SUPABASE_URL}/functions/v1/get-realtime-token`);
* 		const { client_secret } = await tokenResp.json();
* 		const agent = new RealtimeAgent({ name: "Assistant", instructions: "You are a helpful tutor." });
* 		const session = new RealtimeSession(agent, { model: "gpt-realtime" });
* 		await session.connect({ apiKey: client_secret });The session will automatically handle mic/audio on the device, giving a spoken‑question experience.
* 		Deploy – npx cap sync ios && npx cap open ios then archive via Xcode.

5. Voice‑Agent Edge Function – Ephemeral Token Provider
File: functions/get-realtime-token.ts
import { createClient } from 
"npm:@supabase/supabase-js@2.39.6"
;
const supabase = createClient(
  Deno.env.get(
"SUPABASE_URL"
) ?? 
""
,
  Deno.env.get(
"SUPABASE_SERVICE_ROLE_KEY"
) ?? 
""

);
Deno.serve(async (req: Request) => {
  
// Only allow admin or server‑side calls

  const auth = req.headers.get(
"Authorization"
);
  const { data: { user } } = await supabase.auth.getUser(auth?.split(
" "
).pop() ?? 
""
);
  if (!user || !(user.role?.includes(
"admin"
) || user.role?.includes(
"service_role"
))) {
    return new Response(JSON.stringify({ error: 
"Forbidden"
 }), { status: 
403
 });
  }
  const openAiKey = Deno.env.get(
"OPENAI_API_KEY"
) ?? 
""
;
  const resp = await fetch(
"https://api.openai.com/v1/realtime/client_secrets"
, {
    method: 
"POST"
,
    headers: {
      
"Authorization"
: `Bearer ${openAiKey}`,
      
"Content-Type"
: 
"application/json"
,
    },
    body: JSON.stringify({
      session: { type: 
"realtime"
, model: 
"gpt-realtime"
 },
    }),
  });
  const data = await resp.json();
  return new Response(JSON.stringify({ client_secret: data.client_secret?.value ?? 
""
 }), {
    headers: { 
"Content-Type"
: 
"application/json"
 },
  });
});

* 		The mobile app calls this endpoint to obtain a short‑lived client secret, then passes it to the Realtime SDK.
* 		RLS is not a concern here because the function runs with the service‑role key.

6. Free Assessments (No Signup)
* 		Set visibility = 'public' for the 5‑6 “free” assessments.
* 		Ensure the RLS policy for anon (see § 1.2) allows SELECT on those rows.
* 		No assessment_results insertion for anon users; optionally store a temporary browser‑local result for instant feedback.
Sample data insertion (use the Edge Function or a one‑off migration):

SQL Query



INSERT INTO public.assessments (title, description, type, visibility, ai_provider, ai_model, ai_prompt)
VALUES
  ('General Knowledge Quiz', 'A short 5‑question quiz', 'quiz', 'public', 'openai', 'gpt-4o-mini', 'Generate a 5‑question general‑knowledge quiz.');

Success. No rows returned
Repeat for each free assessment.

7. Summary Checklist
* 		[ ] Run the four CREATE TABLE statements (via display_query).
* 		[ ] Apply the RLS policies for public visitors and admin CRUD.
* 		[ ] Deploy the create‑assessment Edge Function and the stored procedure.
* 		[ ] Build the admin UI wizard that calls the Edge Function.
* 		[ ] Scaffold the Capacitor iOS app, integrate Supabase client, and embed the Realtime voice agent using the token provider function.
* 		[ ] Populate 5‑6 free public assessments; add 20 AI‑generated assessments via the admin panel.
* 		[ ] Test end‑to‑end: visitor sees free assessments, takes a quiz, hears voice prompts; admin creates a new course with AI, configures visibility, and publishes.
Following this plan gives you a fully functional, AI‑driven assessment platform with both web and native iOS experiences, protected data access, and an immersive voice‑agent powered by OpenAI’s Realtime API.
