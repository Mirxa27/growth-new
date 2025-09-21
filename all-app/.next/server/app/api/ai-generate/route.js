"use strict";(()=>{var e={};e.id=621,e.ids=[621],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},5466:(e,t,i)=>{i.r(t),i.d(t,{originalPathname:()=>v,patchFetch:()=>q,requestAsyncStorage:()=>y,routeModule:()=>x,serverHooks:()=>_,staticGenerationAsyncStorage:()=>w});var n={};i.r(n),i.d(n,{POST:()=>c});var s=i(9303),o=i(8716),r=i(670),a=i(7070);async function c(e){try{let t;let{contentType:i,topic:n,description:s,difficulty:o,aiProvider:r="openai",aiModel:c}=await e.json();if(!n||!i)return a.NextResponse.json({error:"Missing required fields"},{status:400});let u=`Create a comprehensive ${i} about "${n}".`+(({assessment:`
      Generate an assessment with the following structure:
      - Title: A clear, engaging title
      - Description: 2-3 sentences explaining what the assessment measures
      - Instructions: Clear instructions for taking the assessment
      - Questions: 15-20 questions appropriate for ${o} difficulty
      
      For each question include:
      - Question text
      - Question type (multiple_choice, rating, or true_false)
      - Options (for multiple choice)
      - Correct answer or scoring guidance
      
      ${s?`Additional requirements: ${s}`:""}
      
      Return the response as a JSON object.
    `,course:`
      Generate a course outline with the following structure:
      - Title: An engaging course title
      - Description: Comprehensive course description
      - Learning objectives: 4-5 clear objectives
      - Duration: Estimated hours to complete
      - Modules: 6-8 modules with titles and descriptions
      - For each module, include 3-5 lessons
      
      Difficulty level: ${o}
      ${s?`Additional requirements: ${s}`:""}
      
      Return the response as a JSON object.
    `,test:`
      Generate a test with the following structure:
      - Title: Clear test title
      - Description: What the test evaluates
      - Time limit: Suggested time in minutes
      - Passing score: Percentage required to pass
      - Questions: 20-30 questions for ${o} difficulty
      
      Include various question types with clear correct answers.
      ${s?`Additional requirements: ${s}`:""}
      
      Return the response as a JSON object.
    `,exploration:`
      Generate an interactive exploration/learning experience about "${n}":
      - Title: Engaging title
      - Description: What learners will explore
      - Sections: 5-7 interactive sections
      - Activities: Hands-on activities or experiments
      - Discussion prompts: Thought-provoking questions
      
      Make it ${o} level appropriate.
      ${s?`Additional requirements: ${s}`:""}
      
      Return the response as a JSON object.
    `})[i]||""),l=c;switch(r){case"openai":l=c||"gpt-4o-mini",t=await p(u,i,l);break;case"anthropic":l=c||"claude-3-5-sonnet-20240620",t=await g(u,i,l);break;case"google":l=c||"gemini-1.5-flash",t=await h(u,i,l);break;default:throw Error("Invalid AI provider")}return a.NextResponse.json({content:t,model:l,provider:r})}catch(e){return console.error("AI generation error:",e),a.NextResponse.json({error:"Failed to generate content"},{status:500})}}async function p(e,t,i){let n=process.env.OPENAI_API_KEY;if(!n)throw Error("OpenAI API key not configured");let s=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${n}`,"Content-Type":"application/json"},body:JSON.stringify({model:i,messages:[{role:"system",content:"You are an expert educational content creator. Generate high-quality, engaging educational content in JSON format."},{role:"user",content:e}],temperature:.7,response_format:{type:"json_object"}})});if(!s.ok)throw Error("OpenAI API request failed");let o=JSON.parse((await s.json()).choices[0].message.content);return"assessment"===t?u(o):"course"===t?l(o):"test"===t?d(o):"exploration"===t?m(o):o}function u(e){return{title:e.title||"Untitled Assessment",description:e.description||"",instructions:e.instructions||"Please answer all questions honestly.",questions:(e.questions||[]).map((e,t)=>({id:`q${t+1}`,text:e.question_text||e.text||e.question,type:e.question_type||e.type||"multiple_choice",options:e.options||e.choices,correct_answer:e.correct_answer||e.answer,points:e.points||1,explanation:e.explanation||""})),category_id:null,time_limit:e.time_limit||30,passing_score:e.passing_score||70}}function l(e){return{title:e.title||"Untitled Course",description:e.description||"",learning_objectives:e.learning_objectives||e.objectives||[],duration_hours:e.duration||e.duration_hours||10,modules:(e.modules||[]).map((e,t)=>({title:e.title||`Module ${t+1}`,description:e.description||"",lessons:e.lessons||[],order_index:t})),difficulty:e.difficulty||"intermediate"}}function d(e){return{title:e.title||"Untitled Test",description:e.description||"",time_limit:e.time_limit||30,passing_score:e.passing_score||70,questions:(e.questions||[]).map((e,t)=>({id:`q${t+1}`,text:e.question_text||e.text||e.question,type:e.question_type||e.type||"multiple_choice",options:e.options||e.choices,correct_answer:e.correct_answer||e.answer,points:e.points||1,explanation:e.explanation||""}))}}function m(e){return{title:e.title||"Untitled Exploration",description:e.description||"",sections:e.sections||[],activities:e.activities||[],prompts:e.prompts||e.discussion_prompts||[],difficulty:e.difficulty||"intermediate"}}async function g(e,t,i){let n=process.env.ANTHROPIC_API_KEY;if(!n)return p(e,t,"gpt-4o-mini");let s=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"x-api-key":n,"anthropic-version":"2023-06-01","content-type":"application/json"},body:JSON.stringify({model:i,max_tokens:4e3,system:"You are an expert educational content creator. Respond ONLY with valid minified JSON object matching the requested structure.",messages:[{role:"user",content:e}]})});if(!s.ok)return p(e,t,"gpt-4o-mini");let o=await s.json(),r=f(o?.content?.[0]?.text||"{}");return"assessment"===t?u(r):"course"===t?l(r):"test"===t?d(r):"exploration"===t?m(r):r}async function h(e,t,i){let n=process.env.GOOGLE_API_KEY||process.env.GOOGLE_GENERATIVE_AI_API_KEY;if(!n)return p(e,t,"gpt-4o-mini");let s=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(i)}:generateContent?key=${n}`,o=await fetch(s,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({contents:[{role:"user",parts:[{text:e}]}],generationConfig:{temperature:.7,responseMimeType:"application/json"}})});if(!o.ok)return p(e,t,"gpt-4o-mini");let r=await o.json(),a=f(r?.candidates?.[0]?.content?.parts?.[0]?.text||"{}");return"assessment"===t?u(a):"course"===t?l(a):"test"===t?d(a):"exploration"===t?m(a):a}function f(e){try{return JSON.parse(e)}catch{let t=e.indexOf("{"),i=e.lastIndexOf("}");if(-1!==t&&-1!==i&&i>t)try{return JSON.parse(e.slice(t,i+1))}catch{}return{}}}let x=new s.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/ai-generate/route",pathname:"/api/ai-generate",filename:"route",bundlePath:"app/api/ai-generate/route"},resolvedPagePath:"/home/runner/work/growth-new/growth-new/all-app/src/app/api/ai-generate/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:y,staticGenerationAsyncStorage:w,serverHooks:_}=x,v="/api/ai-generate/route";function q(){return(0,r.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:w})}}};var t=require("../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),n=t.X(0,[276,972],()=>i(5466));module.exports=n})();