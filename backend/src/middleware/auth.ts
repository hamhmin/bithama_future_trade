import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: number;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  const token = req.headers.authorization; // "Bearer 토큰" 에서 토큰만 추출

  if (!token) {
    res.status(401).json({ message: "토큰이 없어요." });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: "유효하지 않은 토큰이에요." });
  }
};
