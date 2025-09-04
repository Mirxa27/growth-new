import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- Configuration ---

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Environment variables should be set in your Supabase project settings
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY") ?? "";

// Initialize Supabase client with the service role key for elevated privileges
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- Type Definitions ---

type Answer = {
  question_id: number | string;
  value: unknown; // Can be string, number, array, etc.
};

type ClientQuestion = {
  id: string;
  text: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  options?: string[];
  scale?: { min: number; max: number; labels?: string[] };
};

type RequestBody = {
  assessment_id: number | string;
  answers: Answer[];
  user_id?: string | null;
  visitor_session_id?: string | null;
  time_taken_seconds?: number;
  meta?: Record<string, any>;
  client_questions?: ClientQuestion[];
};

// --- Main Edge Function ---

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- 0. Input Validation ---
    const body: RequestBody = await req.json();
    const { assessment_id, answers, user_id, visitor_session_id, time_taken_seconds, meta = {}, client_questions } = body;

    if (!assessment_id || !Array.isArray(answers) || answers.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid required fields: assessment_id, answers" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- 1. Fetch Assessment and Question Data from Database ---
    const { data: assessmentData } = await supabase
      .from("assessments")
      .select("id, title, type, category, scoring_spec")
      .eq("id", assessment_id)
      .single();

    const { data: dbQuestions } = await supabase
      .from("assessment_questions")
      .select("id, question_text, question_type, position")
      .eq("assessment_id", assessment_id)
      .order("position", { ascending: true });

    const questionMap = new Map((dbQuestions || []).map(q => [q.id, q]));
    const optionsByQuestion = new Map<number, any[]>();

    if (dbQuestions && dbQuestions.length > 0) {
      const questionIds = dbQuestions.map(q => q.id);
      const { data: allOptions } = await supabase
        .from("assessment_options")
        .select("id, question_id, option_text, is_correct, position, score_value")
        .in("question_id", questionIds);
      
      (allOptions || []).forEach(opt => {
        const arr = optionsByQuestion.get(opt.question_id) || [];
        arr.push(opt);
        optionsByQuestion.set(opt.question_id, arr);
      });
    }

    // --- 2. Compute Scores from Answers ---
    let totalScore = 0;
    const perQuestionResults: any[] = [];
    const usingDbQuestions = dbQuestions && dbQuestions.length > 0;

    for (const ans of answers) {
      let question: any = null;
      let questionType: string = '';

      if (usingDbQuestions) {
        question = questionMap.get(ans.question_id as number);
        if (!question) continue; // Skip unknown questions
        questionType = question.question_type;
      } else if (client_questions) {
        const cq = client_questions.find(q => q.id === String(ans.question_id));
        if (!cq) continue;
        question = { question_text: cq.text };
        questionType = cq.type;
      } else {
        continue; // No question source, skip
      }

      let questionScore = 0;
      let maxQuestionScore = 0;

      if (questionType === "multiple_choice") {
        const options = optionsByQuestion.get(ans.question_id as number) || [];
        const selectedIds = new Set(Array.isArray(ans.value) ? ans.value : [ans.value]);
        
        options.forEach(opt => {
          const value = Number(opt.score_value ?? (opt.is_correct ? 1 : 0));
          maxQuestionScore = Math.max(maxQuestionScore, value);
          if (selectedIds.has(opt.id)) {
            questionScore += value;
          }
        });
      } else if (questionType === "scale") {
        questionScore = Number(ans.value) || 0;
        maxQuestionScore = (client_questions?.find(q => q.id === ans.question_id)?.scale?.max) || 5;
      }

      totalScore += questionScore;
      perQuestionResults.push({
        question_id: ans.question_id,
        question_text: question.question_text,
        question_type: questionType,
        raw_answer: ans.value,
        score: questionScore,
        max_score: maxQuestionScore,
      });
    }

    const interpretedScores = { totalScore, ...(assessmentData?.scoring_spec as object || {}) };

    // --- 3. AI Enrichment (Optional) ---
    let ai_enrichment = {};
    if (OPENAI_KEY) {
      try {
        const systemPrompt = `You are an expert assessment analyst. Analyze the provided assessment results and generate a concise, helpful summary. Return ONLY a valid JSON object with the keys "summary" (string), "insights" (array of strings), and "recommendations" (array of strings).`;
        const userContent = JSON.stringify({ 
          title: assessmentData?.title ?? String(assessment_id), 
          scores: interpretedScores, 
          per_question: perQuestionResults.slice(0, 30) // Limit payload size
        });

        const resp = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userContent }],
            temperature: 0.3,
            max_tokens: 800,
            response_format: { type: "json_object" }, // Enforce JSON output
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data.choices?.[0]?.message?.content;
          if (text) ai_enrichment = JSON.parse(text);
        }
      } catch (aiErr) {
        console.error("AI enrichment error:", aiErr.message);
        // Non-fatal, proceed without AI enrichment
      }
    }

    // --- 4. Persist Result to Database ---
    const resultPayload = {
      assessment_id,
      assessment_title: assessmentData?.title ?? String(assessment_id),
      assessment_type: assessmentData?.type ?? 'public',
      per_question: perQuestionResults,
      scores: interpretedScores,
      time_taken_seconds: Number(time_taken_seconds ?? 0),
      meta,
      ai_enrichment,
    };

    const { data: inserted, error: insertErr } = await supabase
      .from("assessment_results")
      .insert({
        assessment_id,
        user_id,
        assessment_type: assessmentData?.type ?? 'public',
        answers,
        results: resultPayload,
        score: totalScore,
      })
      .select("id")
      .single();

    if (insertErr) throw insertErr;

    // --- 5. Return Successful Response ---
    return new Response(
      JSON.stringify({
        success: true,
        result_id: inserted.id,
        summary: (ai_enrichment as any)?.summary,
        insights: (ai_enrichment as any)?.insights,
        recommendations: (ai_enrichment as any)?.recommendations,
        scores: interpretedScores,
        persisted: { id: inserted.id, assessment_results: resultPayload, ai_insights: ai_enrichment },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("submit-result function error:", error);
    return new Response(JSON.stringify({ error: error.message ?? "An unknown error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
