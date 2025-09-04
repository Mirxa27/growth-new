import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sdp, type } = req.body;

  // In a real application, you would send the offer to a signaling server,
  // which would then forward it to the other peer. For this example, we'll
  // just log it to the console.
  console.log('Received WebRTC offer:', { sdp, type });

  // Here, you would typically wait for an answer from the other peer.
  // For this example, we'll just return a dummy answer.
  const dummyAnswer = {
    sdp: 'dummy-sdp',
    type: 'answer',
  };

  res.status(200).json(dummyAnswer);
}