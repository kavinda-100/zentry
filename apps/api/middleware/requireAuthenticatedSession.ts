import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { redis } from '../lib/redis/redis';
import { ErrorResponse } from '../utils/responseHandles';
import { StatusCodes } from '../utils/statusCodes';
import { logger } from '../utils/logger';
import { sessionObjectSchema } from '@zentry/validation/src/auth';

/**
 * @description This function is used to extract the session token from the request.
 * @param req {Request} - The request object from Express.
 * @returns {string | null} The session token or null if not found.
 * */
const extractSessionToken = (req: Request): string | null => {
  // SESSION_TOKEN_COOKIE_NAME is `session_token` by default
  const cookieToken =
    typeof req.cookies?.session_token === 'string' ? req.cookies.session_token.trim() : '';
  if (cookieToken) {
    return cookieToken;
  }

  const authorizationHeader = req.headers.authorization?.trim();
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(/\s+/, 2);
  if (scheme === 'Bearer' && token) {
    return token;
  }

  return null;
};

/**
 * @description This function is used to validate an authenticated session.
 * @param req {Request} - The request object from Express.
 * @param res {Response} - The response object from Express.
 * @param next {NextFunction} - The next function from Express.
 * @returns {Promise<void>} A promise that resolves when the session is validated.
 * It appends the session object to the request object and calls the next middleware.
 * */
export const requireAuthenticatedSession: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  // get the session token from the request
  const sessionToken = extractSessionToken(req);

  // if no session token is found, return an error
  if (!sessionToken) {
    ErrorResponse(
      res,
      StatusCodes.UNAUTHORIZED,
      'Authentication token is missing. Provide a session cookie or Bearer token.',
    );
    return;
  }

  const redisKey = `session:${sessionToken}`;

  try {
    // find the session snapshot in Redis and get its TTL
    const [sessionSnapshotRaw, ttl] = await Promise.all([redis.get(redisKey), redis.ttl(redisKey)]);

    // if the session snapshot is not found or has expired, return an error
    if (ttl === -2 || !sessionSnapshotRaw) {
      ErrorResponse(res, StatusCodes.UNAUTHORIZED, 'Session not found or already expired.');
      return;
    }

    // if the session snapshot is found but has expired, return an error
    if (ttl <= 0) {
      ErrorResponse(res, StatusCodes.UNAUTHORIZED, 'Session token has expired.');
      return;
    }
    // parse the session snapshot and validate it
    const sessionSnapshot = JSON.parse(sessionSnapshotRaw);
    const validatedSessionObject = sessionObjectSchema.safeParse(sessionSnapshot);
    // if the session object is invalid, return an error
    if (!validatedSessionObject.success) {
      logger.error({ error: validatedSessionObject.error, redisKey }, 'Invalid session object.');
      ErrorResponse(res, StatusCodes.UNAUTHORIZED, 'Invalid session object.');
      return;
    }
    // if the session object is valid, attach the session object to the request object and call the next middleware
    req.token = sessionToken;
    req.sessionId = validatedSessionObject.data.sessionId;
    req.ipAddress = validatedSessionObject.data.ipAddress;
    req.user = validatedSessionObject.data.user;
    req.account = validatedSessionObject.data.account;
    req.org = {
      ...(req.org ?? {}),
      ...validatedSessionObject.data.org,
    };

    logger.info('session validated successfully and append to the Request');
    next();
  } catch (error) {
    logger.error({ error, redisKey }, 'Failed to validate authenticated session.');
    next(error);
  }
};
