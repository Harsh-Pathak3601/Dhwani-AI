import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User, { IUser } from '../models/User.js';
import logger from '../utils/logger.js';

export interface AuthRequest extends Request {
  user?: IUser | null;
}

interface JwtPayload {
  id: string;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is not set');
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload;

      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch (error) {
      logger.error('Token verification failed', { error });
      res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ status: 'error', message: 'Not authorized, no token' });
    return;
  }
};
