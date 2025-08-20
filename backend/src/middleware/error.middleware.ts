
import { Request, Response, NextFunction } from 'express';

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  (res as any).status(500).json({
    message: err.message || '发生了意外错误',
    // Optional: include stack in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};
