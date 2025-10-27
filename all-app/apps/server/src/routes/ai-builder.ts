import type { Request, Response } from 'express';
import express from 'express';
import OpenAI from 'openai';
import { z } from 'zod';

const router = express.Router();

const bodySchema = z.object({
  topic: z.string().min(3),
  productTypes: z.array(z.enum(['test', 'assessment', 'exploration', 'course'])).nonempty(),
  model: z.string().default('gpt-4o-mini'),
});

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { topic, productTypes, model } = bodySchema.parse(req.body);
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const system = `You are an educational content generator. Given a topic, create structured JSON for assessments, tests, explorations, and courses. Each should include title, objectives, sections, items with questions and answers, difficulty and estimated time.`;

    const user = JSON.stringify({ topic, productTypes });

    const rsp = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = rsp.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (error: any) {
    console.error('AI builder error', error);
    res.status(400).json({ error: 'Invalid request or generation failed' });
  }
});

export default router;

