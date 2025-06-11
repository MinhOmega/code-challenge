import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError, ErrorCodes } from '../types/user.types';

/**
 * Generic validation middleware factory
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      if (error.errors) {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        const apiError = new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          'Validation failed',
          400,
          validationErrors
        );
        next(apiError);
      } else {
        next(new ApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid request data', 400));
      }
    }
  };
};

/**
 * Validate query parameters
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error: any) {
      if (error.errors) {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        const apiError = new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          'Query validation failed',
          400,
          validationErrors
        );
        next(apiError);
      } else {
        next(new ApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid query parameters', 400));
      }
    }
  };
};

/**
 * Validate route parameters
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error: any) {
      if (error.errors) {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        const apiError = new ApiError(
          ErrorCodes.VALIDATION_ERROR,
          'Parameter validation failed',
          400,
          validationErrors
        );
        next(apiError);
      } else {
        next(new ApiError(ErrorCodes.VALIDATION_ERROR, 'Invalid parameters', 400));
      }
    }
  };
};

/**
 * Error handler middleware
 */
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Set default error values
  let statusCode = 500;
  let errorCode = ErrorCodes.INTERNAL_SERVER_ERROR;
  let message = 'Internal server error';
  let details: unknown = undefined;

  // Handle known API errors
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = ErrorCodes.VALIDATION_ERROR;
    message = 'Validation failed';
    details = err.message;
  }

  // Log error for debugging
  console.error('API Error:', {
    errorCode,
    message,
    statusCode,
    details,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: errorCode,
    message,
    details: process.env.NODE_ENV === 'development' ? details : undefined,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Async error wrapper - catches async errors and passes to error handler
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 