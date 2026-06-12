import type { Response } from 'express';
import { StatusCodes } from './statusCodes';

/**
 * @description This function is used to send a successful response to the client. It takes in the response object, status code, message and data (optional) as parameters and sends a JSON response to the client.
 * @param {Response} res - The response object from Express.
 * @param {number} status_code - The HTTP status code to be sent in the response.
 * @param {string} message - A message describing the response.
 * @param {T | null} data - The data to be sent in the response (optional).
 * @returns {void} This function does not return anything, it sends a response to the client.
 * @template T - The type of the data being sent in the response.
 * @example
 * OKResponse(res, StatusCodes.CREATED, 'User created successfully', { id: 1, name: 'John Doe' });
 */
export function OKResponse<T>(
  res: Response,
  status_code: (typeof StatusCodes)[keyof typeof StatusCodes],
  message: string,
  data: T | null = null,
) {
  res.status(status_code).json({
    success: true,
    status_code,
    message,
    data,
  });
}

/**
 * @description This function is used to send an error response to the client. It takes in the response object, status code and message as parameters and sends a JSON response to the client.
 * @param {Response} res - The response object from Express.
 * @param {number} status_code - The HTTP status code to be sent in the response.
 * @param {string} message - A message describing the error.
 * @param data {T | null} - The data to be sent in the response (optional).
 * @returns {void} This function does not return anything, it sends a response to the client.
 * @example
 * ErrorResponse(res, StatusCodes.BAD_REQUEST, 'Invalid email address');
 */
export function ErrorResponse<T>(
  res: Response,
  status_code: (typeof StatusCodes)[keyof typeof StatusCodes],
  message: string,
  data: T | null = null,
): void {
  res.status(status_code).json({
    success: false,
    status_code,
    message,
    data,
  });
}
