import type { Request, Response } from 'express';
import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

// Generate ephemeral client key for browser Realtime SDK
router.post('/token', async (_req: Request, res: Response) => {
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.realtime.sessions.create({
      model: 'gpt-realtime',
      // Optionally customize session defaults here
    });
    res.json({ client_secret: response.client_secret });
  } catch (error: any) {
    console.error('Failed to create ephemeral token', error);
    res.status(500).json({ error: 'Failed to create token' });
  }
});

export default router;

