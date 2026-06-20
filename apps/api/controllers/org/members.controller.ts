import type { NextFunction, Request, Response } from 'express';
import { logger } from '../../utils/logger';
import {
  getMemberParamsSchema,
  updateMemberRoleParamsSchema,
  updateMemberRoleSchema,
} from '@zentry/validation/src/org/members';
import { ErrorResponse, OKResponse } from '../../utils/responseHandles';
import { StatusCodes } from '../../utils/statusCodes';
import { formatZodIssues } from '@zentry/validation/src/utils/zod';
import { prisma } from '@zentry/database';

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

/**
 * @description The controller for getting the details of a member.
 * This will check if the user is an organization admin and then find the member.
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

    OKResponse(res, StatusCodes.OK, 'Member role updated', updatedMember);
  } catch (error) {
    next(error);
  }
};
