import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    code: 200,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
