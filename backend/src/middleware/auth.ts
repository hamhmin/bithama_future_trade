// backend/src/middleware/auth.ts
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
  // 헤더 대신 쿠키에서 토큰 읽기
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ message: "로그인이 필요해요." });
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
