import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""; // service role for secure writes
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type Answer = {
  question_id: number;
  // value can be number (option id), string (text), number[] (multiple option ids), or numeric for scales
  value: any;
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      assessment_id,
      answers,
      user_id,
      visitor_session_id,
      time_taken_seconds,
      meta = {},
    } = body as {
      assessment_id: number;
      answers: Answer[];
      user_id?: string | null;
      visitor_session_id?: string | null;
      time_taken_seconds?: number;
      meta?: Record<string, any>;
    };

    if (!assessment_id || !Array.isArray(answers)) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: assessment_id, answers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch assessment and questions
    const { data: assessmentData, error: aErr } = await supabase
      .from("assessments")
      .select("id, title, type, category, scoring_spec")
      .eq("id", assessment_id)
      .single();

    if (aErr || !assessmentData) {
      return new Response(JSON.stringify({ error: "Assessment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch questions and options for multiple choice
    const { data: qData, error: qErr } = await supabase
      .from("assessment_questions")
      .select("id, question_text, question_type, position")
      .eq("assessment_id", assessment_id)
      .order("position", { ascending: true });

    if (qErr) {
      return new Response(JSON.stringify({ error: "Failed to load questions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const questionMap = new Map<number, any>();
    (qData || []).forEach((q: any) => questionMap.set(q.id, q));

    // Preload options for all question ids that are multiple_choice
    const questionIds = (qData || []).map((q: any) => q.id);
    const { data: allOptions } = await supabase
      .from("assessment_options")
      .select("id, question_id, option_text, is_correct, position, score_value")
      .in("question_id", questionIds);

    const optionsByQuestion = new Map<number, any[]>();
    (allOptions || []).forEach((opt: any) => {
      const arr = optionsByQuestion.get(opt.question_id) || [];
      arr.push(opt);
      optionsByQuestion.set(opt.question_id, arr);
    });

    // Compute scores
    let totalScore = 0;
    const perQuestionResults: any[] = [];

    for (const ans of answers) {
      const q = questionMap.get(ans.question_id);
      if (!q) {
        perQuestionResults.push({
          question_id: ans.question_id,
          recognized: false,
          note: "Unknown question id",
        });
        continue;
      }

      const qType = q.question_type;
      let questionScore = 0;
      let maxQuestionScore = 0;

      if (qType === "multiple_choice") {
        const opts = optionsByQuestion.get(ans.question_id) || [];
        // Determine selected option(s)
        const selected = Array.isArray(ans.value) ? ans.value : [ans.value];
        // Calculate score_value from options (score_value if present else is_correct -> 1)
        for (const opt of opts) {
          const val = Number(opt.score_value ?? (opt.is_correct ? 1 : 0));
          maxQuestionScore = Math.max(maxQuestionScore, val);
        }
        // Sum selected
        for (const sel of selected) {
          const match = opts.find(o => o.id === Number(sel));
          if (match) {
            const val = Number(match.score_value ?? (match.is_correct ? 1 : 0));
            questionScore += val;
          }
        }
      } else if (qType === "scale") {
        // Expect numeric value
        const num = Number(ans.value) || 0;
        questionScore = num;
        maxQuestionScore = 5; // conservative default (may be overridden by scoring_spec)
      } else {
        // free_text or others: not scored numerically by default
        questionScore = 0;
        maxQuestionScore = 0;
      }

      totalScore += questionScore;
      perQuestionResults.push({
        question_id: ans.question_id,
        question_text: q.question_text,
        question_type: qType,
        raw_answer: ans.value,
        score: questionScore,
        max_score: maxQuestionScore,
      });
    }

    // If assessment has a scoring_spec field in DB, attempt to run categorical calculations
    let interpretedScores: any = {};
    if (assessmentData.scoring_spec) {
      try {
        // scoring_spec assumed to be JSON with a mapping or rules (this is flexible)
        const spec = typeof assessmentData.scoring_spec === "string"
          ? JSON.parse(assessmentData.scoring_spec)
          : assessmentData.scoring_spec;
        // example spec: { type: 'cumulative' } or more complex mapping — we keep it extensible
        interpretedScores = { totalScore, specUsed: spec };
      } catch (err) {
        interpretedScores = { totalScore, specUsed: null };
      }
    } else {
      interpretedScores = { totalScore };
    }

    // Build result payload
    const resultPayload = {
      assessment_id,
      assessment_title: assessmentData.title,
      assessment_type: assessmentData.type,
      answers_submitted: answers,
      per_question: perQuestionResults,
      scores: interpretedScores,
      time_taken_seconds: Number(time_taken_seconds ?? 0),
      meta,
    };

    // Optionally call OpenAI to generate summary/insights/recommendations
    let ai_enrichment: { summary?: string; insights?: string[]; recommendations?: string[] } = {};
    if (OPENAI_KEY) {
      try {
        const systemPrompt = `You are an expert assessment analyst. Given an assessment title, per-question results and computed scores, generate:
1) a short summary (2-3 sentences),
2) 3 concise insights (bullet points),
3) 3 practical recommendations.
Return ONLY a JSON object: { "summary": "...", "insights": ["..."], "recommendations": ["..."] }`;

        const userContent = JSON.stringify({
          title: assessmentData.title,
          scores: interpretedScores,
          per_question: perQuestionResults.slice(0, 50), // limit length
        });

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini", // fallback model choice; can be configured
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userContent },
            ],
            temperature: 0.2,
            max_tokens: 800,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) {
            try {
              ai_enrichment = JSON.parse(text);
            } catch (e) {
              // If OpenAI returned non-JSON, put it in summary
              ai_enrichment = { summary: String(text).slice(0, 2000) };
            }
          }
        } else {
          // non-fatal: proceed without AI enrichment
          console.warn("OpenAI responded with non-ok status", resp.status);
        }
      } catch (aiErr) {
        console.error("AI enrichment error:", aiErr);
      }
    } else {
      // Deterministic fallback enrichment
      ai_enrichment = {
        summary: `You completed "${assessmentData.title}". Total score: ${totalScore}.`,
        insights: [
          `Answered ${perQuestionResults.length} questions.`,
          totalScore > 0 ? "You scored above zero; consider exploring recommended materials." : "Consider reattempting or exploring beginner resources.",
          "Use this result to track your progress over time.",
        ],
        recommendations: [
          "Review areas with zero or low scores and try targeted exercises.",
          "Repeat the assessment after practicing for at least two weeks.",
          "Consider signing up to save progress and get personalized plans."
        ],
      };
    }

    // Persist to DB
    const insertPayload: any = {
      assessment_id,
      user_id: user_id ?? null,
      visitor_session_id: visitor_session_id ?? null,
      assessment_results: resultPayload,
      score_total: totalScore,
      ai_insights: ai_enrichment,
      meta: meta ?? {},
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("assessment_results")
      .insert(insertPayload)
      .select("*")
      .limit(1)
      .single();

    if (insertErr) {
      console.error("Failed to insert assessment_results:", insertErr);
      return new Response(JSON.stringify({ error: "Failed to persist result" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optionally update analytics (atomic increment)
    try {
      await supabase.rpc("increment_assessment_metric", { _assessment_id: assessment_id });
    } catch (e) {
      // non-fatal if RPC doesn't exist
      console.warn("Metric increment failed or rpc missing", e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        result_id: inserted.id,
        summary: ai_enrichment.summary,
        insights: ai_enrichment.insights,
        recommendations: ai_enrichment.recommendations,
        persisted: inserted,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("submit-result error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});