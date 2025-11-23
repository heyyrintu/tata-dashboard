import { Request, Response, NextFunction } from 'express';
import { body, query, ValidationChain, validationResult } from 'express-validator';
import { createError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * Middleware to validate request and return errors if validation fails
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const requestId = req.id || 'unknown';
      logger.warn('Validation failed', {
        requestId,
        errors: errors.array(),
        path: req.path,
        method: req.method
      });

      return next(createError(
        `Validation failed: ${errors.array().map((e: any) => e.msg).join(', ')}`,
        400
      ));
    }

    next();
  };
};

/**
 * Validation rules for analytics endpoints
 */
export const validateAnalyticsQuery = [
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('fromDate must be a valid ISO 8601 date (YYYY-MM-DD)'),
  
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('toDate must be a valid ISO 8601 date (YYYY-MM-DD)'),
  
  query('fromDate')
    .optional()
    .custom((value: any, { req }: any) => {
      if (req.query?.toDate && value && new Date(value) > new Date(req.query.toDate as string)) {
        throw new Error('fromDate must be before or equal to toDate');
      }
      return true;
    })
];

/**
 * Validation rules for email endpoints
 */
export const validateEmailProcess = [
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit must be an integer between 1 and 100')
];

