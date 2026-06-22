import { NextFunction } from 'express';

export function createMiddleware(req: Request, res: Response, next: NextFunction) {
  next();
}
