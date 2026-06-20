import type { NextFunction, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import {
  banMemberParamsSchema,
  deleteMemberParamsSchema,
  getMemberParamsSchema,
  revokeMemberSessionParamsSchema,
  unbanMemberParamsSchema,
  updateMemberPermissionsParamsSchema,
  updateMemberPermissionsSchema,
  updateMemberRoleParamsSchema,
  updateMemberRoleSchema,
} from '@zentry/validation/src/org/members';
import { ErrorResponse, OKResponse } from '../../utils/responseHandles';
import { StatusCodes } from '../../utils/statusCodes';
import { formatZodIssues } from '@zentry/validation/src/utils/zod';
import { prisma, Prisma } from '@zentry/database';
import { redis } from '../../lib/redis/redis';
import { updateAuthSessionInRedis } from '../../lib/redis/auth.redis';

// check if the user is an organization admin
const isAdminOfOrganization = async (organizationId: string, userId: string) => {
  try {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { rootAdminId: true },
    });
    if (!organization) {
      return false;
    } else {
      return organization.rootAdminId === userId;
    }
  } catch (e) {
    logger.error({ e }, 'error finding isAdminOfOrganization');
    return false;
  }
};

// find the member
const findMember = async (organizationId: string, userId: string) => {
  try {
    return await prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error finding member');
    throw error;
  }
};

const findOrganization = async (organizationId: string) => {
  try {
    return await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, rootAdminId: true },
    });
  } catch (error) {
    logger.error({ error }, 'Error finding organization');
    throw error;
  }
};

const findOrgScopedSessions = async (organizationId: string, userId: string) => {
  try {
    return await prisma.session.findMany({
      where: {
        userId,
        organizationId,
      },
      select: {
        token: true,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error finding organization-scoped sessions');
    throw error;
  }
};

const revokeOrgScopedSessions = async (organizationId: string, userId: string) => {
  const sessions = await findOrgScopedSessions(organizationId, userId);

  if (sessions.length === 0) {
    return 0;
  }

  for (const session of sessions) {
    await redis.del(`session:${session.token}`);
  }

  await prisma.session.deleteMany({
    where: {
      userId,
      organizationId,
    },
  });

  return sessions.length;
};

const getPermissionsSessionValue = (
  permissions: Prisma.InputJsonValue | typeof Prisma.DbNull,
) => {
  if (permissions === Prisma.DbNull) {
    return undefined;
  }

  return JSON.stringify(permissions);
};

/**
 * @description The controller for getting the details of a member.
 * This will check if the user is an organization admin and then find the member.
 *   -TODO: implemented for organization-user sessions
 *   -TODO: dependent on the upcoming org-user login/register flow
 *   -TODO: not yet functional for current Zentry-authenticated sessions by design
 * */
export const getMemberDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('getMemberDetails route hit');

    // validate the request params
    const validatedParams = getMemberParamsSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request params', {
        issues: formatZodIssues(validatedParams.error.issues),
      });
    }

    // check if the user is an organization admin
    const isAdmin = await isAdminOfOrganization(validatedParams.data.organizationId, req.user.id);
    if (!isAdmin) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not authorized to view this member',
      );
    }

    // find the member
    const member = await findMember(
      validatedParams.data.organizationId,
      validatedParams.data.memberId,
    );
    if (!member) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Member not found');
    }

    OKResponse(res, StatusCodes.OK, 'Member details found', member);
  } catch (error) {
    next(error);
  }
};

/**
 * @description The controller for updating the role of a member.
 *   -TODO: implemented for organization-user sessions
 *   -TODO: dependent on the upcoming org-user login/register flow
 *   -TODO: not yet functional for current Zentry-authenticated sessions by design
 * */
export const updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('updateMemberRole route hit');

    // validate the request params
    const validatedParams = updateMemberRoleParamsSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid params', {
        issues: formatZodIssues(validatedParams.error.issues),
      });
    }
    // validate the request body
    const validatedBody = updateMemberRoleSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    // check if the user is an organization admin
    const isAdmin = await isAdminOfOrganization(validatedParams.data.organizationId, req.user.id);
    if (!isAdmin) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not authorized to update this member',
      );
    }

    // find the member
    const member = await findMember(
      validatedParams.data.organizationId,
      validatedParams.data.memberId,
    );
    if (!member) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Member not found');
    }

    // update the member's role
    const updatedMember = await prisma.membership.update({
      where: {
        userId_organizationId: {
          userId: validatedParams.data.memberId,
          organizationId: validatedParams.data.organizationId,
        },
      },
      data: {
        role: validatedBody.data.role,
      },
    });

    const sessions = await findOrgScopedSessions(
      validatedParams.data.organizationId,
      validatedParams.data.memberId,
    );

    for (const session of sessions) {
      await updateAuthSessionInRedis({
        token: session.token,
        updates: {
          org: {
            role: updatedMember.role,
          },
        },
      });
    }

    OKResponse(res, StatusCodes.OK, 'Member role updated', updatedMember);
  } catch (error) {
    next(error);
  }
};

/**
 * @description The controller for revoke member session.
 *   -TODO: implemented for organization-user sessions
 *   -TODO: dependent on the upcoming org-user login/register flow
 *   -TODO: not yet functional for current Zentry-authenticated sessions by design
 */
export const revokeMemberSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('revokeMemberSession route hit');

    // validate the request params
    const validatedParams = revokeMemberSessionParamsSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request params', {
        issues: formatZodIssues(validatedParams.error.issues),
      });
    }

    // check if the user is an organization admin
    const isAdmin = await isAdminOfOrganization(validatedParams.data.organizationId, req.user.id);
    if (!isAdmin) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not authorized to revoke this member session',
      );
    }

    // find the member
    const member = await findMember(
      validatedParams.data.organizationId,
      validatedParams.data.memberId,
    );
    if (!member) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Member not found');
    }

    await revokeOrgScopedSessions(validatedParams.data.organizationId, validatedParams.data.memberId);

    OKResponse(res, StatusCodes.OK, 'Member session revoked');
  } catch (error) {
    next(error);
  }
};

/**
 * @description The controller for ban org user.
 *   -TODO: implemented for organization-user sessions
 *   -TODO: dependent on the upcoming org-user login/register flow
 *   -TODO: not yet functional for current Zentry-authenticated sessions by design
 */
export const banMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('banMember route hit');

    const validatedParams = banMemberParamsSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request params', {
        issues: formatZodIssues(validatedParams.error.issues),
      });
    }

    const isAdmin = await isAdminOfOrganization(validatedParams.data.organizationId, req.user.id);
    if (!isAdmin) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not authorized to ban this member',
      );
    }

    const member = await findMember(
      validatedParams.data.organizationId,
      validatedParams.data.memberId,
    );
    if (!member) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Member not found');
    }

    const updatedMember = await prisma.membership.update({
      where: {
        userId_organizationId: {
          userId: validatedParams.data.memberId,
          organizationId: validatedParams.data.organizationId,
        },
      },
      data: {
        isBanned: true,
      },
    });

    await revokeOrgScopedSessions(validatedParams.data.organizationId, validatedParams.data.memberId);

    OKResponse(res, StatusCodes.OK, 'Member banned successfully', updatedMember);
  } catch (error) {
    next(error);
  }
};

/**
 * @description The controller for unban org user.
 *   -TODO: implemented for organization-user sessions
 *   -TODO: dependent on the upcoming org-user login/register flow
 *   -TODO: not yet functional for current Zentry-authenticated sessions by design
 */
export const unbanMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('unbanMember route hit');

    const validatedParams = unbanMemberParamsSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request params', {
        issues: formatZodIssues(validatedParams.error.issues),
      });
    }

    const isAdmin = await isAdminOfOrganization(validatedParams.data.organizationId, req.user.id);
    if (!isAdmin) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not authorized to unban this member',
      );
    }

    const member = await findMember(
      validatedParams.data.organizationId,
      validatedParams.data.memberId,
    );
    if (!member) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Member not found');
    }

    const updatedMember = await prisma.membership.update({
      where: {
        userId_organizationId: {
          userId: validatedParams.data.memberId,
          organizationId: validatedParams.data.organizationId,
        },
      },
      data: {
        isBanned: false,
      },
    });

    OKResponse(res, StatusCodes.OK, 'Member unbanned successfully', updatedMember);
  } catch (error) {
    next(error);
  }
};

/**
 * @description The controller for updating org user permissions.
 *   -TODO: implemented for organization-user sessions
 *   -TODO: dependent on the upcoming org-user login/register flow
 *   -TODO: not yet functional for current Zentry-authenticated sessions by design
 */
export const updateMemberPermissions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    logger.info('updateMemberPermissions route hit');

    const validatedParams = updateMemberPermissionsParamsSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request params', {
        issues: formatZodIssues(validatedParams.error.issues),
      });
    }

    const validatedBody = updateMemberPermissionsSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    const isAdmin = await isAdminOfOrganization(validatedParams.data.organizationId, req.user.id);
    if (!isAdmin) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not authorized to update this member permissions',
      );
    }

    const member = await findMember(
      validatedParams.data.organizationId,
      validatedParams.data.memberId,
    );
    if (!member) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Member not found');
    }

    const permissionsValue =
      validatedBody.data.permissions === null
        ? Prisma.DbNull
        : (validatedBody.data.permissions as Prisma.InputJsonValue);

    const updatedMember = await prisma.membership.update({
      where: {
        userId_organizationId: {
          userId: validatedParams.data.memberId,
          organizationId: validatedParams.data.organizationId,
        },
      },
      data: {
        permissions: permissionsValue,
      },
    });

    await prisma.session.updateMany({
      where: {
        userId: validatedParams.data.memberId,
        organizationId: validatedParams.data.organizationId,
      },
      data: {
        permissions: permissionsValue,
      },
    });

    const sessions = await findOrgScopedSessions(
      validatedParams.data.organizationId,
      validatedParams.data.memberId,
    );

    for (const session of sessions) {
      await updateAuthSessionInRedis({
        token: session.token,
        updates: {
          org: {
            permissions: getPermissionsSessionValue(permissionsValue),
          },
        },
      });
    }

    OKResponse(res, StatusCodes.OK, 'Member permissions updated successfully', updatedMember);
  } catch (error) {
    next(error);
  }
};

/**
 * @description The controller for deleting org user.
 *   -TODO: implemented for organization-user sessions
 *   -TODO: dependent on the upcoming org-user login/register flow
 *   -TODO: not yet functional for current Zentry-authenticated sessions by design
 */
export const deleteMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('deleteMember route hit');

    const validatedParams = deleteMemberParamsSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request params', {
        issues: formatZodIssues(validatedParams.error.issues),
      });
    }

    const isAdmin = await isAdminOfOrganization(validatedParams.data.organizationId, req.user.id);
    if (!isAdmin) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not authorized to delete this member',
      );
    }

    const organization = await findOrganization(validatedParams.data.organizationId);
    if (!organization) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Organization not found');
    }

    if (organization.rootAdminId === validatedParams.data.memberId) {
      return ErrorResponse(
        res,
        StatusCodes.BAD_REQUEST,
        'The organization root admin cannot be deleted from member management',
      );
    }

    const member = await findMember(
      validatedParams.data.organizationId,
      validatedParams.data.memberId,
    );
    if (!member) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Member not found');
    }

    await revokeOrgScopedSessions(validatedParams.data.organizationId, validatedParams.data.memberId);

    const result = await prisma.$transaction(async (tx) => {
      await tx.membership.delete({
        where: {
          userId_organizationId: {
            userId: validatedParams.data.memberId,
            organizationId: validatedParams.data.organizationId,
          },
        },
      });

      const [remainingMemberships, ownedOrganizations] = await Promise.all([
        tx.membership.count({
          where: { userId: validatedParams.data.memberId },
        }),
        tx.organization.count({
          where: { rootAdminId: validatedParams.data.memberId },
        }),
      ]);

      if (remainingMemberships === 0 && ownedOrganizations === 0) {
        await tx.user.delete({
          where: { id: validatedParams.data.memberId },
        });

        return { userDeleted: true };
      }

      return { userDeleted: false };
    });

    OKResponse(res, StatusCodes.OK, 'Member deleted successfully', result);
  } catch (error) {
    next(error);
  }
};
