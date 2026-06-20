import { Router } from 'express';
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationById,
  getAllOrganizationsForUser,
} from '../controllers/org/index.controller';
import { standardRateLimiter } from '../middleware/rateLimiter';
import { requireAuthenticatedSession } from '../middleware/requireAuthenticatedSession';
import { getMemberDetails, updateMemberRole } from '../controllers/org/members.controller';

const router = Router();

// POST https://localhost:5000/api/v1/org
router.post('/', standardRateLimiter, requireAuthenticatedSession, createOrganization);
// GET https://localhost:5000/api/v1/org/my/all
router.get('/my/all', standardRateLimiter, requireAuthenticatedSession, getAllOrganizationsForUser);
// PATCH https://localhost:5000/api/v1/org/:id
router.patch('/:id', standardRateLimiter, requireAuthenticatedSession, updateOrganization);
// DELETE https://localhost:5000/api/v1/org/:id
router.delete('/:id', standardRateLimiter, requireAuthenticatedSession, deleteOrganization);
// GET https://localhost:5000/api/v1/org/:id
router.get('/:id', standardRateLimiter, requireAuthenticatedSession, getOrganizationById);

// for member-related routes,
// GET https://localhost:5000/api/v1/org/members/:memberId/:organizationId
router.get(
  '/members/:memberId/:organizationId',
  standardRateLimiter,
  requireAuthenticatedSession,
  getMemberDetails,
);
// PATCH https://localhost:5000/api/v1/org/members/:memberId/:organizationId
router.patch(
  '/members/:memberId/:organizationId',
  standardRateLimiter,
  requireAuthenticatedSession,
  updateMemberRole,
);

export default router;
