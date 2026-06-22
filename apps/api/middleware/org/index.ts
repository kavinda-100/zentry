import type { RequestHandler, Request, Response, NextFunction } from 'express';
import { prisma } from '@zentry/database';
import { ErrorResponse } from '../../utils/responseHandles';
import { StatusCodes } from '../../utils/statusCodes';

export const resolveOrgContext: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const orgId = req.header('X-Zentry-Org-ID')?.trim();

  if (!orgId) {
    ErrorResponse(res, StatusCodes.BAD_REQUEST, 'X-Zentry-Org-ID is required.');
    return;
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: {
      id: true,
      name: true,
      rootAdminId: true,
      appHomeUrl: true,
      appCallbackUrl: true,
    },
  });

  if (!org) {
    ErrorResponse(res, StatusCodes.UNAUTHORIZED, 'Organization not found.');
    return;
  }

  req.org.id = org.id;
  next();
};

export const requireOrgMembership: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const orgId = req.org.id;
  const userId = req.user.id;

  if (!orgId)
    return ErrorResponse(
      res,
      StatusCodes.BAD_REQUEST,
      'Organization not found in request context.',
    );

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: orgId,
      },
    },
  });

  if (!membership || membership.isBanned) {
    ErrorResponse(res, StatusCodes.FORBIDDEN, 'You are not allowed to access this organization.');
    return;
  }

  next();
};
