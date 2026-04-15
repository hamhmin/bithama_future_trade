import prisma from "./prisma.js";
import { sendToUser } from "./websocket.js";

// const FUNDING_INTERVAL_MS = 8 * 60 * 60 * 1000; // 8시간
const FUNDING_INTERVAL_MS = 10 * 1000; // 테스트용10초

// 다음 펀딩 시각 계산 (00:00 / 08:00 / 16:00 UTC)
const getNextFundingTime = (): number => {
  const now = new Date();
  const hours = now.getUTCHours();
  const nextHour = [0, 8, 16].find((h) => h > hours) ?? 24;
  const next = new Date(now);
  next.setUTCHours(nextHour, 0, 0, 0);
  if (nextHour === 24) {
    next.setUTCDate(next.getUTCDate() + 1);
    next.setUTCHours(0, 0, 0, 0);
  }
  return next.getTime() - Date.now();
};

// 바이낸스에서 펀딩비율 가져오기
const fetchFundingRate = async (): Promise<number> => {
  try {
    const res = await fetch(
      "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT",
    );
    const data = await res.json();
    return parseFloat(data.lastFundingRate);
  } catch {
    console.error("펀딩비율 가져오기 실패");
    return 0.0001; // 실패 시 기본값 0.01%
  }
};

// 펀딩비 차감 실행
const applyFunding = async () => {
  const fundingRate = await fetchFundingRate();
  const affectedUsers = new Set<number>(); // 영향받은 유저 추적

  console.log(`펀딩비 적용 시작. 비율: ${fundingRate}`);

  // 오픈 포지션 전체 가져오기
  const positions = await prisma.position.findMany({
    where: { status: "open" },
    include: { user: { include: { wallet: true } } },
  });

  for (const position of positions) {
    const wallet = position.user.wallet;
    if (!wallet) continue;

    // 펀딩비 계산
    // Long + 양수 → 차감 / Long + 음수 → 지급
    // Short + 양수 → 지급 / Short + 음수 → 차감
    const positionValue = position.entryPrice * position.size;
    let fundingAmount = positionValue * Math.abs(fundingRate);

    const isCharged =
      (position.side === "long" && fundingRate > 0) ||
      (position.side === "short" && fundingRate < 0);

    if (!isCharged) fundingAmount = -fundingAmount; // 지급이면 음수

    try {
      await prisma.$transaction(async (tx) => {
        if (isCharged) {
          // 차감: 지갑 잔고에서 먼저 차감
          if (wallet.balance >= fundingAmount) {
            await tx.wallet.update({
              where: { userId: position.userId },
              data: { balance: { decrement: fundingAmount } },
            });
          } else {
            // 잔고 부족 → 증거금에서 차감
            const remaining = fundingAmount - wallet.balance;
            const newMargin = position.margin - remaining;

            await tx.wallet.update({
              where: { userId: position.userId },
              data: {
                balance: 0,
                locked: { decrement: remaining },
              },
            });

            // 유지마진 이하로 떨어지면 청산
            const maintenanceMargin = position.margin * 0.005;
            if (newMargin <= maintenanceMargin) {
              await tx.position.update({
                where: { id: position.id },
                data: {
                  status: "liquidated",
                  pnl: -position.margin,
                },
              });
              console.log(`포지션 ${position.id} 펀딩비 미납으로 청산`);
            } else {
              await tx.position.update({
                where: { id: position.id },
                data: { margin: newMargin },
              });
            }
          }
        } else {
          // 지급: 지갑 잔고에 추가
          await tx.wallet.update({
            where: { userId: position.userId },
            data: { balance: { increment: Math.abs(fundingAmount) } },
          });
        }

        // 펀딩 기록
        await tx.fundingHistory.create({
          data: {
            userId: position.userId,
            positionId: position.id,
            amount: isCharged ? -fundingAmount : Math.abs(fundingAmount),
            rate: fundingRate,
          },
        });
      });

      console.log(
        `유저 ${position.userId} 포지션 ${position.id} 펀딩비 ${isCharged ? "차감" : "지급"}: ${fundingAmount.toFixed(4)} USDT`,
      );
      affectedUsers.add(position.userId); // 영향받은 유저 기억하기
    } catch (err) {
      console.error(`포지션 ${position.id} 펀딩비 처리 오류:`, err);
    }
  }
  // 모든 처리 완료 후 유저별 한 번만 전송
  affectedUsers.forEach((userId) => {
    sendToUser(userId, {
      type: "funding",
      message: "펀딩비가 적용됐어요!",
    });
  });

  console.log("펀딩비 적용 완료!");
};

// 펀딩비 스케줄러 시작
export const startFundingScheduler = () => {
  const delay = getNextFundingTime();
  console.log(`다음 펀딩까지 ${Math.round(delay / 60000)}분 남았어요.`);

  setTimeout(() => {
    applyFunding();
    // 이후 8시간마다 반복
    setInterval(applyFunding, FUNDING_INTERVAL_MS);
  }, delay);
};

// 테스트용 바로 실행
// export const startFundingScheduler = () => {
//   console.log(`즉시 실행`);
//   applyFunding(); // 즉시 실행
//   setInterval(applyFunding, FUNDING_INTERVAL_MS);
// };
