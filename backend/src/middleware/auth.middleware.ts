
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AuthenticatedRequest } from '../types';

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token;
  const authReq = req as AuthenticatedRequest;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
      authReq.user = { id: decoded.id };
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: '授权失败，令牌无效' });
    }
  }

  if (!token) {
    res.status(401).json({ message: '未授权，缺少令牌' });
  }
};
