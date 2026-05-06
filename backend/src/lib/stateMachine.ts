// 주문/포지션 상태 머신
// 유효한 상태 전이 규칙을 중앙화해서 정합성을 유지해요.

// ─── 주문 상태 전이 규칙 ───────────────────────────────────────
// open      → filled    : 지정가 조건 충족 시 자동 체결
// open      → cancelled : 유저 취소 요청 or 잔고 부족
// (시장가 주문은 생성 즉시 filled로 처리되므로 open을 거치지 않아요)
const ORDER_TRANSITIONS: Record<string, string[]> = {
  open: ["filled", "cancelled"],
  filled: [], // 터미널 상태 - 더 이상 전이 불가
  cancelled: [], // 터미널 상태 - 더 이상 전이 불가
};

// ─── 포지션 상태 전이 규칙 ────────────────────────────────────
// open → closed     : 수동 청산 or TP/SL 도달
// open → liquidated : 청산가 도달 (강제청산)
const POSITION_TRANSITIONS: Record<string, string[]> = {
  open: ["closed", "liquidated"],
  closed: [], // 터미널 상태 - 더 이상 전이 불가
  liquidated: [], // 터미널 상태 - 더 이상 전이 불가
};

/**
 * 주문 상태 전이 유효성 검증
 * 유효하지 않은 전이 시 에러를 던져요.
 */
export function transitionOrder(current: string, next: string): void {
  const allowed = ORDER_TRANSITIONS[current];
  if (!allowed) {
    throw new Error(`알 수 없는 주문 상태: ${current}`);
  }
  if (!allowed.includes(next)) {
    throw new Error(
      `유효하지 않은 주문 상태 전이: ${current} → ${next}. 허용된 전이: [${allowed.join(", ") || "없음"}]`,
    );
  }
}

/**
 * 포지션 상태 전이 유효성 검증
 * 유효하지 않은 전이 시 에러를 던져요.
 */
export function transitionPosition(current: string, next: string): void {
  const allowed = POSITION_TRANSITIONS[current];
  if (!allowed) {
    throw new Error(`알 수 없는 포지션 상태: ${current}`);
  }
  if (!allowed.includes(next)) {
    throw new Error(
      `유효하지 않은 포지션 상태 전이: ${current} → ${next}. 허용된 전이: [${allowed.join(", ") || "없음"}]`,
    );
  }
}

/**
 * 터미널 상태 여부 확인
 * 터미널 상태는 더 이상 전이가 불가능해요.
 */
export function isTerminalOrderStatus(status: string): boolean {
  return ORDER_TRANSITIONS[status]?.length === 0;
}

export function isTerminalPositionStatus(status: string): boolean {
  return POSITION_TRANSITIONS[status]?.length === 0;
}
