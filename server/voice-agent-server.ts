import { Application, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { config } from "https://deno.land/x/dotenv@v3.2.2/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const env = await config();
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const app = new Application();
const router = new Router();

router.post("/get-realtime-token", async (ctx) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin_backup")
    .eq("id", session.user.id)
    .single();

  if (!profile?.is_admin_backup) {
    ctx.response.status = 403;
    ctx.response.body = { error: "Forbidden" };
    return;
  }

  const openaiApiKey = env.OPENAI_API_KEY;
  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiApiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    ctx.response.status = 500;
    ctx.response.body = { error: "Failed to get token from OpenAI", details: error };
    return;
  }

  const tokenData = await response.json();
  ctx.response.body = tokenData;
});

app.use(router.routes());
app.use(router.allowedMethods());

console.log("Server running on http://localhost:8000");
await app.listen({ port: 8000 });