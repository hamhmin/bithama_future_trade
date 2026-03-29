import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";

const router = Router();

// 회원가입
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, nickname } = req.body;

  try {
    // 이메일 중복 체크
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: "이미 사용중인 이메일이에요." });
      return;
    }

    // 비밀번호 암호화
    const hashed = await bcrypt.hash(password, 10);

    // 유저 생성
    const user = await prisma.user.create({
      data: { email, password: hashed, nickname },
    });

    res.status(201).json({ message: "회원가입 성공!", userId: user.id });
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});
// 로그인
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // 유저 찾기
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: "이메일 또는 비밀번호가 틀렸어요." });
      return;
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "이메일 또는 비밀번호가 틀렸어요." });
      return;
    }

    // JWT 토큰 발급
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.json({
      message: "로그인 성공!",
      userId: user.id,
      token,
      nickname: user.nickname,
    });
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});
// 내 정보 가져오기 (로그인 필요)
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, email: true, nickname: true, balance: true },
  });
  res.json(user);
});

export default router;
