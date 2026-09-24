import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  logger.error(err.message, { stack: err.stack });
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  res.json({
    status: 'error',
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
