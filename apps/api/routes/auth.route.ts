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
// POST https://localhost:5000/api/v1/auth/register
router.post('/register', strictRateLimiter, register);
// POST https://localhost:5000/api/v1/auth/login
router.post('/login', strictRateLimiter, login);
// POST https://localhost:5000/api/v1/auth/logout
router.post('/logout', strictRateLimiter, requireAuthenticatedSession, logout);
// POST https://localhost:5000/api/v1/auth/verify-email
router.post('/verify-email', strictRateLimiter, requireAuthenticatedSession, verifyEmail);
// GET https://localhost:5000/api/v1/auth/me
router.get('/me', standardRateLimiter, requireAuthenticatedSession, getMe);
// GET https://localhost:5000/api/v1/auth/providers
router.get('/providers', standardRateLimiter, (_req: Request, res: Response) => {
  res.status(200).json({ providers: ['credential', 'google'] });
});
// google oAuth routes
// GET https://localhost:5000/api/v1/auth/providers/google
router.get('/providers/google', standardRateLimiter, googleOauth);
// GET https://localhost:5000/api/v1/auth/providers/google/callback
router.get('/providers/google/callback', standardRateLimiter, googleOauthCallback);

// for organizational auth routes
// router.post('/register/org/:orgId', strictRateLimiter, registerOrganization);

export default router;
