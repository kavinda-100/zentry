import axios, { AxiosError } from 'axios';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { API_BASE_URL, API_KEY_HEADER, ORG_ID_HEADER } from '../constants';
import { createOkResponseSchema, ZentrySessionSchema, type ZentrySessionType } from '../zod';

export interface ZentryClientOptions {
  orgId: string;
  apiKey: string;
}

const SESSION_RESPONSE_SCHEMA = createOkResponseSchema(ZentrySessionSchema);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const extractBearerToken = (req: Request): string | null => {
  const authorizationHeader = req.header('authorization')?.trim();
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(/\s+/, 2);
  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token.trim();
};

const sendError = (res: Response, status: number, message: string) => {
  res.status(status).json({
    success: false,
    status_code: status,
    message,
    data: null,
  });
};

/**
 * @description This class is used to validate the user session with Zentry.
 * @param options {ZentryClientOptions} - The options for the Zentry client.
 * @param options.orgId {string} - The organization ID.
 * @param options.apiKey {string} - The API key.
 * @returns {ZentryClient} - The Zentry client instance.
 * @throws {Error} - If the orgId or apiKey is not provided or is empty.
 * */
export class ZentryClient {
  readonly orgId: string;
  readonly apiKey: string;

  constructor(options: ZentryClientOptions) {
    if (!isNonEmptyString(options.orgId)) {
      throw new Error('ZentryClient requires a non-empty orgId.');
    }

    if (!isNonEmptyString(options.apiKey)) {
      throw new Error('ZentryClient requires a non-empty apiKey.');
    }

    this.orgId = options.orgId.trim();
    this.apiKey = options.apiKey.trim();
  }

  private createRequestHeaders(token: string) {
    return {
      [ORG_ID_HEADER]: this.orgId,
      [API_KEY_HEADER]: this.apiKey,
      Authorization: `Bearer ${token}`,
    };
  }

  private async verifyUserToken(token: string): Promise<ZentrySessionType> {
    if (!isNonEmptyString(token)) {
      throw new Error('A non-empty user token is required.');
    }

    const response = await axios.get(`${API_BASE_URL}/auth/org/me`, {
      headers: this.createRequestHeaders(token.trim()),
    });

    const validatedResponse = SESSION_RESPONSE_SCHEMA.safeParse(response.data);
    if (!validatedResponse.success) {
      throw new Error('Invalid session payload received from Zentry.');
    }

    return validatedResponse.data.data;
  }

  private async getSessionFromRequest(req: Request): Promise<ZentrySessionType> {
    const token = extractBearerToken(req);
    if (!token) {
      throw new Error('Authentication token is missing. Provide a Bearer token.');
    }

    return this.verifyUserToken(token);
  }

  requireUser(): RequestHandler {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        req.zentry = await this.getSessionFromRequest(req);
        next();
      } catch (error) {
        if (error instanceof AxiosError) {
          const statusCode = error.response?.status ?? 502;

          if (statusCode === 401 || statusCode === 403) {
            sendError(res, 401, 'Unauthorized user session.');
            return;
          }

          sendError(res, 502, 'Failed to validate the user session with Zentry.');
          return;
        }

        if (error instanceof Error) {
          if (error.message.includes('Authentication token is missing')) {
            sendError(res, 401, error.message);
            return;
          }

          if (error.message.includes('Invalid session payload')) {
            sendError(res, 502, error.message);
            return;
          }
        }

        next(error);
      }
    };
  }

  requireOrg(): RequestHandler {
    return (_req: Request, res: Response, next: NextFunction) => {
      if (!this.orgId || !this.apiKey) {
        sendError(res, 500, 'Zentry client is not configured correctly.');
        return;
      }

      next();
    };
  }
}

export { extractBearerToken };
