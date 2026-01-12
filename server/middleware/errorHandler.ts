import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ApiResponse } from '../types/index.js';

export function errorHandler(
  err: Error | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Validation error',
      message: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
    };
    res.status(400).json(response);
    return;
  }

  // Database errors
  if (err.message.includes('database') || err.message.includes('SQL')) {
    console.error('Database error:', err);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Database error',
      message: 'An error occurred while accessing the database',
    };
    res.status(500).json(response);
    return;
  }

  // Generic errors
  console.error('API error:', err);
  const response: ApiResponse<null> = {
    success: false,
    error: err.name || 'Internal server error',
    message: err.message || 'An unexpected error occurred',
  };

  // Don't expose internal error details in production
  if (process.env.NODE_ENV === 'production' && !err.message.startsWith('Validation')) {
    response.message = 'An unexpected error occurred';
  }

  res.status(err.message.includes('Not found') ? 404 : 500).json(response);
}

export function notFoundHandler(req: Request, res: Response): void {
  const response: ApiResponse<null> = {
    success: false,
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`,
  };
  res.status(404).json(response);
}



