import { Router } from 'express';
import type { Request, Response } from 'express';
import { standardRateLimiter, strictRateLimiter } from '../middleware/rateLimiter';
import { requireAuthenticatedSession } from '../middleware/requireAuthenticatedSession';
import {
  register,
  login,
  logout,
  getMe,
  checkIsAuthenticated,
} from '../controllers/auth/standard/index.controller';
import { verifyEmail } from '../controllers/auth/standard/verify.email.controller';
import {
  googleOauth,
  googleOauthCallback,
} from '../controllers/auth/standard/google.oauth.controller';
import { resolveOrgContext, requireOrgMembership } from '../middleware/org';
import {
  orgExchangeCode,
  getOrgMe,
  orgLogin,
  orgLogout,
  orgRegister,
  orgVerifyEmail,
} from '../controllers/auth/org/index.controller';
import {
  orgGoogleOauth,
  orgGoogleOauthCallback,
} from '../controllers/auth/org/org.google.oauth.controller';

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
// GET https://localhost:5000/api/v1/auth/is-authenticated
router.get(
  '/is-authenticated',
  standardRateLimiter,
  requireAuthenticatedSession,
  checkIsAuthenticated,
);
// GET https://localhost:5000/api/v1/auth/providers
router.get('/providers', standardRateLimiter, (_req: Request, res: Response) => {
  res.status(200).json({ providers: ['credential', 'google'] });
});
// google oAuth routes
// GET https://localhost:5000/api/v1/auth/providers/google
router.get('/providers/google', standardRateLimiter, googleOauth);
// GET https://localhost:5000/api/v1/auth/providers/google/callback
router.get('/providers/google/callback', standardRateLimiter, googleOauthCallback);

// ------------------------------------ for organizational auth routes ----------------------------------------------------

// POST https://localhost:5000/api/v1/auth/org/register
router.post('/org/register', strictRateLimiter, resolveOrgContext, orgRegister);
// POST https://localhost:5000/api/v1/auth/org/login
router.post('/org/login', strictRateLimiter, resolveOrgContext, orgLogin);
// POST https://localhost:5000/api/v1/auth/org/exchange
router.post('/org/exchange', strictRateLimiter, resolveOrgContext, orgExchangeCode);
// POST https://localhost:5000/api/v1/auth/org/logout
router.post(
  '/org/logout',
  strictRateLimiter,
  resolveOrgContext,
  requireAuthenticatedSession,
  requireOrgMembership,
  orgLogout,
);
// POST https://localhost:5000/api/v1/auth/org/verify-email
router.post('/org/verify-email', strictRateLimiter, resolveOrgContext, orgVerifyEmail);
// GET https://localhost:5000/api/v1/auth/org/me
router.get(
  '/org/me',
  standardRateLimiter,
  resolveOrgContext,
  requireAuthenticatedSession,
  requireOrgMembership,
  getOrgMe,
);

// org google oAuth routes
// GET https://localhost:5000/api/v1/auth/org/providers/google
router.get('/org/providers/google', standardRateLimiter, resolveOrgContext, orgGoogleOauth);
// GET https://localhost:5000/api/v1/auth/org/providers/google/callback
router.get('/org/providers/google/callback', standardRateLimiter, orgGoogleOauthCallback);

export default router;
