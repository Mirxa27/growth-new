import { Router } from 'express';
import realtime from './realtime';
import aiBuilder from './ai-builder';
import assessments from './assessments';
import content from './content';

const router = Router();

router.use('/realtime', realtime);
router.use('/ai-builder', aiBuilder);
router.use('/assessments', assessments);
router.use('/content', content);

export default router;

