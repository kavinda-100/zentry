import { Router } from 'express';
import type { Request, Response } from 'express';
import { standardRateLimiter, strictRateLimiter } from '../middleware/rateLimiter';

export const router = Router();

// Mount routes with their respective protection matrices
router.post('/register', strictRateLimiter, (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Scaffold registration route hit safely.' });
});

router.post('/login', strictRateLimiter, (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Scaffold login route hit safely.' });
});

router.get('/providers', standardRateLimiter, (_req: Request, res: Response) => {
  res.status(200).json({ providers: ['credential', 'google'] });
});

export default router;
