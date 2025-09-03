"use strict";(()=>{var e={};e.id=621,e.ids=[621],e.modules={517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},712:(e,t,i)=>{i.r(t),i.d(t,{headerHooks:()=>h,originalPathname:()=>f,patchFetch:()=>v,requestAsyncStorage:()=>p,routeModule:()=>l,serverHooks:()=>g,staticGenerationAsyncStorage:()=>d,staticGenerationBailout:()=>m});var s={};i.r(s),i.d(s,{POST:()=>c});var n=i(5419),r=i(9108),o=i(9678),a=i(8070);async function c(e){try{let t;let{contentType:i,topic:s,description:n,difficulty:r,aiProvider:o}=await e.json();if(!s||!i)return a.Z.json({error:"Missing required fields"},{status:400});let c=`Create a comprehensive ${i} about "${s}".`+(({assessment:`
      Generate an assessment with the following structure:
      - Title: A clear, engaging title
      - Description: 2-3 sentences explaining what the assessment measures
      - Instructions: Clear instructions for taking the assessment
      - Questions: 15-20 questions appropriate for ${r} difficulty
      
      For each question include:
      - Question text
      - Question type (multiple_choice, rating, or true_false)
      - Options (for multiple choice)
      - Correct answer or scoring guidance
      
      ${n?`Additional requirements: ${n}`:""}
      
      Return the response as a JSON object.
    `,course:`
      Generate a course outline with the following structure:
      - Title: An engaging course title
      - Description: Comprehensive course description
      - Learning objectives: 4-5 clear objectives
      - Duration: Estimated hours to complete
      - Modules: 6-8 modules with titles and descriptions
      - For each module, include 3-5 lessons
      
      Difficulty level: ${r}
      ${n?`Additional requirements: ${n}`:""}
      
      Return the response as a JSON object.
    `,test:`
      Generate a test with the following structure:
      - Title: Clear test title
      - Description: What the test evaluates
      - Time limit: Suggested time in minutes
      - Passing score: Percentage required to pass
      - Questions: 20-30 questions for ${r} difficulty
      
      Include various question types with clear correct answers.
      ${n?`Additional requirements: ${n}`:""}
      
      Return the response as a JSON object.
    `,exploration:`
      Generate an interactive exploration/learning experience about "${s}":
      - Title: Engaging title
      - Description: What learners will explore
      - Sections: 5-7 interactive sections
      - Activities: Hands-on activities or experiments
      - Discussion prompts: Thought-provoking questions
      
      Make it ${r} level appropriate.
      ${n?`Additional requirements: ${n}`:""}
      
      Return the response as a JSON object.
    `})[i]||"");switch(o){case"openai":case"anthropic":case"google":t=await u(c,i);break;default:throw Error("Invalid AI provider")}return a.Z.json({content:t,model:"openai"===o?"gpt-4":o})}catch(e){return console.error("AI generation error:",e),a.Z.json({error:"Failed to generate content"},{status:500})}}async function u(e,t){let i=process.env.OPENAI_API_KEY;if(!i)throw Error("OpenAI API key not configured");let s=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{Authorization:`Bearer ${i}`,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4",messages:[{role:"system",content:"You are an expert educational content creator. Generate high-quality, engaging educational content in JSON format."},{role:"user",content:e}],temperature:.7,response_format:{type:"json_object"}})});if(!s.ok)throw Error("OpenAI API request failed");let n=JSON.parse((await s.json()).choices[0].message.content);return"assessment"===t?{title:n.title||"Untitled Assessment",description:n.description||"",instructions:n.instructions||"Please answer all questions honestly.",questions:(n.questions||[]).map((e,t)=>({id:`q${t+1}`,text:e.question_text||e.text||e.question,type:e.question_type||e.type||"multiple_choice",options:e.options||e.choices,correct_answer:e.correct_answer||e.answer,points:e.points||1,explanation:e.explanation||""})),category_id:null,time_limit:n.time_limit||30,passing_score:n.passing_score||70}:"course"===t?{title:n.title||"Untitled Course",description:n.description||"",learning_objectives:n.learning_objectives||n.objectives||[],duration_hours:n.duration||n.duration_hours||10,modules:(n.modules||[]).map((e,t)=>({title:e.title||`Module ${t+1}`,description:e.description||"",lessons:e.lessons||[],order_index:t})),difficulty:n.difficulty||"intermediate"}:n}let l=new n.AppRouteRouteModule({definition:{kind:r.x.APP_ROUTE,page:"/api/ai-generate/route",pathname:"/api/ai-generate",filename:"route",bundlePath:"app/api/ai-generate/route"},resolvedPagePath:"/workspace/all-app/src/app/api/ai-generate/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:p,staticGenerationAsyncStorage:d,serverHooks:g,headerHooks:h,staticGenerationBailout:m}=l,f="/api/ai-generate/route";function v(){return(0,o.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:d})}}};var t=require("../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),s=t.X(0,[638,206],()=>i(712));module.exports=s})();