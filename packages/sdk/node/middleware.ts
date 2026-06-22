import type { NextFunction, Request, Response } from 'express';

export function createMiddleware(_req: Request, _res: Response, next: NextFunction) {
  next();
}
