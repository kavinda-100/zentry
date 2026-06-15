import { Router } from 'express';
import type { Request, Response } from 'express';
import { standardRateLimiter, strictRateLimiter } from '../middleware/rateLimiter';
import { requireAuthenticatedSession } from '../middleware/requireAuthenticatedSession';
import { register, login, logout, getMe } from '../controllers/auth/standard/index.controller';
import { verifyEmail } from '../controllers/auth/standard/verify.email.controller';
import {
  googleOauth,
  googleOauthCallback,
} from '../controllers/auth/standard/google.oauth.controller';

export const router = Router();

//-------------------------------- standard auth routes ----------------------------------------------
router.post('/register', strictRateLimiter, register);
router.post('/login', strictRateLimiter, login);
router.post('/logout', strictRateLimiter, requireAuthenticatedSession, logout);
router.post('/verify-email', strictRateLimiter, requireAuthenticatedSession, verifyEmail);
router.get('/me', standardRateLimiter, requireAuthenticatedSession, getMe);
// standard oAuth routes
router.get('/providers', standardRateLimiter, (_req: Request, res: Response) => {
  res.status(200).json({ providers: ['credential', 'google'] });
});
// google oAuth routes
router.get('/providers/google', standardRateLimiter, googleOauth);
router.get('/providers/google/callback', standardRateLimiter, googleOauthCallback);

// for organizational auth routes
// router.post('/register/org/:orgId', strictRateLimiter, registerOrganization);

export default router;
