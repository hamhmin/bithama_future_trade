// backend/src/routes/auth.ts
import { Router } from "express";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../prisma.js";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.js";
import type { AuthRequest } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";

const router = Router();

// 회원가입
router.post("/register", async (req: Request, res: Response) => {
  const { email, password, nickname } = req.body;

  // 이메일 양식 검증
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ message: "올바른 이메일 형식이 아니에요." });
    return;
  }

  // 비밀번호 제한 (최소 8자, 영문+숫자 조합)
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{8,}$/;
  if (!passwordRegex.test(password)) {
    res.status(400).json({
      message: "비밀번호는 8자 이상, 영문+숫자 조합이어야 해요.",
    });
    return;
  }

  // 닉네임 길이 제한
  if (!nickname || nickname.length < 2 || nickname.length > 20) {
    res.status(400).json({
      message: "닉네임은 2자 이상 20자 이하로 입력해주세요.",
    });
    return;
  }

  try {
    // 이메일 중복 체크 (기존)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: "이미 사용중인 이메일이에요." });
      return;
    }

    // 닉네임 중복 체크 추가
    const existingNickname = await prisma.user.findFirst({
      where: { nickname },
    });
    if (existingNickname) {
      res.status(400).json({ message: "이미 사용중인 닉네임이에요." });
      return;
    }

    // 비밀번호 암호화
    const hashed = await bcrypt.hash(password, 10);

    // 유저 생성
    const user = await prisma.user.create({
      data: { email, password: hashed, nickname },
    });

    // 회원가입 시 지갑도 자동 생성
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balance: 100000, // 테스트용 초기 잔고 10만 USDT
      },
    });

    res.status(201).json({ message: "회원가입 성공!", userId: user.id });
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "로그인 시도가 너무 많아요. 잠시 후 다시 시도해주세요." },
});
// 로그인
router.post("/login", loginLimiter, async (req: Request, res: Response) => {
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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    // httpOnly 쿠키로 토큰 전송
    res.cookie("token", token, {
      httpOnly: true, // JS에서 접근 불가 → XSS 방어
      // secure: false, // IP 환경에선 false // 도메인추가시 아래 주석으로 변경.
      // sameSite: "lax", // IP 환경에선 lax // 도메인추가시 아래 주석으로 변경.
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // lax - CSRF 방어
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7일
    });

    res.json({
      message: "로그인 성공!",
      userId: user.id,
      nickname: user.nickname,
    });
  } catch (err) {
    res.status(500).json({ message: "서버 오류" });
  }
});

// 로그아웃
router.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ message: "로그아웃 성공!" });
});

// 내 정보
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, nickname: true, tutorialCompleted: true },
  });

  const wallet = await prisma.wallet.findUnique({
    where: { userId: req.userId! },
    select: { balance: true, locked: true },
  });

  res.json({
    ...user,
    wallet: wallet
      ? {
          balance: Math.max(0, wallet.balance),
          locked: Math.max(0, wallet.locked),
        }
      : null,
  });
});
router.patch(
  "/tutorial-complete",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    await prisma.user.update({
      where: { id: req.userId! },
      data: { tutorialCompleted: true },
    });
    res.json({ message: "ok" });
  },
);

// 닉네임 변경
router.patch(
  "/profile",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { nickname } = req.body;

    if (!nickname || nickname.length < 2 || nickname.length > 20) {
      res.status(400).json({
        message: "닉네임은 2자 이상 20자 이하로 입력해주세요.",
      });
      return;
    }

    // 닉네임 중복 체크 (본인 제외)
    const existing = await prisma.user.findFirst({
      where: {
        nickname,
        NOT: { id: userId },
      },
    });
    if (existing) {
      res.status(400).json({ message: "이미 사용중인 닉네임이에요." });
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { nickname },
    });

    res.json({ message: "닉네임 변경 완료!" });
  },
);

// 비밀번호 변경
router.patch(
  "/password",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const userId = req.userId!;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ message: "유저를 찾을 수 없어요." });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "현재 비밀번호가 틀렸어요." });
      return;
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    res.json({ message: "비밀번호 변경 완료!" });
  },
);
// USDT 환율 프록시
router.get("/usdt-price", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.upbit.com/v1/ticker?markets=KRW-USDT",
    );
    const data = await response.json();
    res.json({ price: data[0].trade_price });
  } catch {
    res.json({ price: 1484 });
  }
});
export default router;
