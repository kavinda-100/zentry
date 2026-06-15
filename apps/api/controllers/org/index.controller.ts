import type { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { ErrorResponse, OKResponse } from '../../utils/responseHandles';
import { StatusCodes } from '../../utils/statusCodes';
import { createOrgSchema, updateOrgSchema, orgIdParamSchema } from '@zentry/validation/src/org';
import { formatZodIssues } from '@zentry/validation/src/utils/zod';
import { prisma, Role } from '@zentry/database';

const canAccessOrganization = async (organizationId: string, userId: string): Promise<boolean> => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { rootAdminId: true },
  });

  if (!organization) {
    return false;
  }

  if (organization.rootAdminId === userId) {
    return true;
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    select: { isBanned: true },
  });

  return Boolean(membership && !membership.isBanned);
};

/**
 * @description The controller for creating a new organization.
 * This will create a new organization in the database and return the created organization.
 * */
export const createOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Creating organization with data: %o', req.body);

    // validate the request body
    const validatedBody = createOrgSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    // create the organization in the database
    const org = await prisma.$transaction(async (tx) => {
      const createdOrganization = await tx.organization.create({
        data: {
          rootAdminId: req.user.id,
          name: validatedBody.data.name,
          logoUrl: validatedBody.data.logoUrl,
        },
      });

      await tx.membership.create({
        data: {
          userId: req.user.id,
          organizationId: createdOrganization.id,
          role: Role.ADMIN,
        },
      });

      return createdOrganization;
    });

    OKResponse(res, StatusCodes.CREATED, 'Organization created successfully', org);
  } catch (e) {
    next(e);
  }
};

/***
 * @description The controller for getting a single organization by ID.
 */
export const getOrganizationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Getting organization with ID: %s', req.params.id);

    // validate the organization id on the request params
    const validatedParams = orgIdParamSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid organization ID', {
        issues: formatZodIssues(validatedParams.error.issues),
      });
    }

    // find the organization by id
    const hasAccess = await canAccessOrganization(validatedParams.data.id, req.user.id);
    if (!hasAccess) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not authorized to view this organization',
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: validatedParams.data.id },
      include: {
        memberships: {
          include: {
            user: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    if (!org) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Organization not found');
    }

    OKResponse(res, StatusCodes.OK, 'Organization found', org);
  } catch (e) {
    next(e);
  }
};

/**
 * @description The controller for getting all organizations the user owns or belongs to.
 * */
export const getAllOrganizationsForUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    logger.info('Getting all organizations for user with ID: %s', req.user.id);

    // find all organizations that the user owns or is an active member of
    const organizations = await prisma.organization.findMany({
      where: {
        OR: [
          { rootAdminId: req.user.id },
          {
            memberships: {
              some: {
                userId: req.user.id,
                isBanned: false,
              },
            },
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    OKResponse(res, StatusCodes.OK, 'Organizations found', organizations);
  } catch (e) {
    next(e);
  }
};

/**
 * @description The controller for updating an existing organization.
 * */
export const updateOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Updating organization with data: %o', req.body);

    // validate the request body
    const validatedBody = updateOrgSchema.safeParse(req.body);
    if (!validatedBody.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid request body', {
        issues: formatZodIssues(validatedBody.error.issues),
      });
    }

    // validate the organization id on the request params
    const validatedParams = orgIdParamSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid organization ID', {
        issues: formatZodIssues(validatedParams.error.issues),
      });
    }

    // find the organization by id
    const org = await prisma.organization.findUnique({
      where: { id: validatedParams.data.id },
    });
    if (!org) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Organization not found');
    }

    // check if the user is the root admin of the organization
    if (org.rootAdminId !== req.user.id) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not authorized to update this organization',
      );
    }

    // update the organization in the database
    const updatedOrg = await prisma.organization.update({
      where: { id: validatedParams.data.id },
      data: {
        name: validatedBody.data.name ?? org.name,
        logoUrl: validatedBody.data.logoUrl ?? org.logoUrl,
      },
    });

    OKResponse(res, StatusCodes.OK, 'Organization updated successfully', updatedOrg);
  } catch (e) {
    next(e);
  }
};

/**
 * @description The controller for deleting an existing organization.
 * */
export const deleteOrganization = async (req: Request, res: Response, next: NextFunction) => {
  try {
    logger.info('Deleting organization with ID: %s', req.params.id);

    // validate the organization id on the request params
    const validatedParams = orgIdParamSchema.safeParse(req.params);
    if (!validatedParams.success) {
      return ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid organization ID', {
        issues: formatZodIssues(validatedParams.error.issues),
      });
    }

    // find the organization by id
    const org = await prisma.organization.findUnique({
      where: { id: validatedParams.data.id },
    });
    if (!org) {
      return ErrorResponse(res, StatusCodes.NOT_FOUND, 'Organization not found');
    }

    // check if the user is the root admin of the organization
    if (org.rootAdminId !== req.user.id) {
      return ErrorResponse(
        res,
        StatusCodes.FORBIDDEN,
        'You are not authorized to delete this organization',
      );
    }

    // delete the organization from the database
    await prisma.organization.delete({
      where: { id: validatedParams.data.id },
    });

    OKResponse(res, StatusCodes.OK, 'Organization deleted successfully');
  } catch (e) {
    next(e);
  }
};
