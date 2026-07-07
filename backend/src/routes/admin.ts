import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import prisma from "../prisma.js";

const router = Router();
const DEFAULT_RESET_BALANCE = 100000;

function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const adminSecret = process.env.ADMIN_SECRET;
  const requestSecret = req.header("x-admin-secret");

  if (!adminSecret) {
    res.status(503).json({ message: "관리자 비밀키가 설정되지 않았어요." });
    return;
  }

  if (!requestSecret || requestSecret !== adminSecret) {
    res.status(401).json({ message: "관리자 인증이 필요해요." });
    return;
  }

  next();
}

router.use(adminMiddleware);

router.get("/users", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const where = q
    ? {
        OR: [{ email: { contains: q } }, { nickname: { contains: q } }],
      }
    : {};
  const users = await prisma.user.findMany({
    where,
    include: {
      wallet: true,
      _count: {
        select: {
          positions: true,
          orders: true,
          fundingHistories: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  res.json({
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      isGuest: user.email.startsWith("guest_"),
      tutorialCompleted: user.tutorialCompleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      wallet: user.wallet
        ? {
            balance: user.wallet.balance,
            locked: user.wallet.locked,
            total: user.wallet.balance + user.wallet.locked,
            updatedAt: user.wallet.updatedAt,
          }
        : null,
      counts: user._count,
    })),
  });
});

router.patch("/users/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { email, nickname, tutorialCompleted } = req.body;

  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "잘못된 유저 ID예요." });
    return;
  }

  const data: {
    email?: string;
    nickname?: string;
    tutorialCompleted?: boolean;
  } = {};

  if (typeof email === "string" && email.trim()) data.email = email.trim();
  if (typeof nickname === "string" && nickname.trim()) {
    const value = nickname.trim();
    if (value.length < 2 || value.length > 20) {
      res.status(400).json({
        message: "닉네임은 2자 이상 20자 이하로 입력해주세요.",
      });
      return;
    }
    data.nickname = value;
  }
  if (typeof tutorialCompleted === "boolean") {
    data.tutorialCompleted = tutorialCompleted;
  }

  const user = await prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      nickname: true,
      tutorialCompleted: true,
      updatedAt: true,
    },
  });

  res.json({ message: "회원 정보가 수정됐어요.", user });
});

router.post("/users/:id/reset-wallet", async (req, res) => {
  const id = Number(req.params.id);
  const balance =
    typeof req.body?.balance === "number" && req.body.balance >= 0
      ? req.body.balance
      : DEFAULT_RESET_BALANCE;

  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "잘못된 유저 ID예요." });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.fundingHistory.deleteMany({ where: { userId: id } });
    await tx.order.deleteMany({ where: { userId: id } });
    await tx.position.deleteMany({ where: { userId: id } });
    await tx.wallet.upsert({
      where: { userId: id },
      create: { userId: id, balance, locked: 0 },
      update: { balance, locked: 0 },
    });
  });

  res.json({ message: "지갑과 거래 기록이 초기화됐어요." });
});

router.delete("/users/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    res.status(400).json({ message: "잘못된 유저 ID예요." });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.fundingHistory.deleteMany({ where: { userId: id } });
    await tx.order.deleteMany({ where: { userId: id } });
    await tx.position.deleteMany({ where: { userId: id } });
    await tx.userSymbolSetting.deleteMany({ where: { userId: id } });
    await tx.wallet.deleteMany({ where: { userId: id } });
    await tx.user.delete({ where: { id } });
  });

  res.json({ message: "회원이 삭제됐어요." });
});

export default router;
