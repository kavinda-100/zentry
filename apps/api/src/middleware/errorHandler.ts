import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from '../utils/statusCodes';

/**
 * @description This function is error handling middleware for Express. It takes in the error object, request, response and next function as parameters. It logs the error message and stack trace to the console and sends a JSON response to the client with a status code of 500 and the error message.
 * @param {Error} err - The error object that was thrown.
 * @param {Request} _req - The request object from Express (not used in this function).
 * @param {Response} res - The response object from Express.
 * @param {NextFunction} next - The next function from Express (not used in this function).
 * @returns {void} This function does not return anything, it sends a response to the client.
 * @example
 * // In your Express app, you would use this middleware like this:
 * app.use(errorHandler);
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error({ message: 'errorHandler', error: err.message });
  console.error({ message: 'errorHandler', error: err.stack });
  res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    status_code: StatusCodes.INTERNAL_SERVER_ERROR,
    message: err.message ?? 'Internal Server Error',
  });
  next();
};
