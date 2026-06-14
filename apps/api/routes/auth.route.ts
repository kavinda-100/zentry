import { Router } from 'express';
import type { Request, Response } from 'express';
import { standardRateLimiter, strictRateLimiter } from '../middleware/rateLimiter';
import { requireAuthenticatedSession } from '../middleware/requireAuthenticatedSession';
import { register, login, logout, getMe } from '../controllers/auth/index.controller';
import { verifyEmail } from '../controllers/auth/verify.email.controller';

export const router = Router();

// staged auth routes
router.post('/register', strictRateLimiter, register);
router.post('/login', strictRateLimiter, login);
router.post('/logout', strictRateLimiter, requireAuthenticatedSession, logout);
router.post('/verify-email', strictRateLimiter, requireAuthenticatedSession, verifyEmail);
router.get('/me', standardRateLimiter, requireAuthenticatedSession, getMe);

router.get('/providers', standardRateLimiter, (_req: Request, res: Response) => {
  res.status(200).json({ providers: ['credential', 'google'] });
});

// for organizational auth routes
// router.post('/register/org/:orgId', strictRateLimiter, registerOrganization);

export default router;
