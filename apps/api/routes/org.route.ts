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
import {
  banMember,
  deleteMember,
  getMemberDetails,
  updateMemberRole,
  unbanMember,
  updateMemberPermissions,
  revokeMemberSession,
} from '../controllers/org/members.controller';

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

// ------------------------------- for member-related routes, --------------------------------------

// GET https://localhost:5000/api/v1/org/members/:memberId/:organizationId
router.get(
  '/members/:memberId/:organizationId',
  standardRateLimiter,
  requireAuthenticatedSession,
  getMemberDetails,
);
// PATCH https://localhost:5000/api/v1/org/members/update-role/:memberId/:organizationId
router.patch(
  '/members/update-role/:memberId/:organizationId',
  standardRateLimiter,
  requireAuthenticatedSession,
  updateMemberRole,
);
// DELETE https://localhost:5000/api/v1/org/members/revoke-session/:memberId/:organizationId
router.delete(
  '/members/revoke-session/:memberId/:organizationId',
  standardRateLimiter,
  requireAuthenticatedSession,
  revokeMemberSession,
);
// PATCH https://localhost:5000/api/v1/org/members/ban/:memberId/:organizationId
router.patch(
  '/members/ban/:memberId/:organizationId',
  standardRateLimiter,
  requireAuthenticatedSession,
  banMember,
);
// PATCH https://localhost:5000/api/v1/org/members/unban/:memberId/:organizationId
router.patch(
  '/members/unban/:memberId/:organizationId',
  standardRateLimiter,
  requireAuthenticatedSession,
  unbanMember,
);
// PATCH https://localhost:5000/api/v1/org/members/update-permissions/:memberId/:organizationId
router.patch(
  '/members/update-permissions/:memberId/:organizationId',
  standardRateLimiter,
  requireAuthenticatedSession,
  updateMemberPermissions,
);
// DELETE https://localhost:5000/api/v1/org/members/delete/:memberId/:organizationId
router.delete(
  '/members/delete/:memberId/:organizationId',
  standardRateLimiter,
  requireAuthenticatedSession,
  deleteMember,
);

export default router;
