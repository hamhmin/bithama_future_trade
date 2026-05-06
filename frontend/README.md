# BITHAMA 🪙

> 바이낸스 실시간 데이터 기반 모의 선물거래 플랫폼

**[bithama.com](https://bithama.com)**

선물거래는 진입장벽이 높아 초보 투자자들이 실제 돈을 잃기 전에 연습할 수 있는 환경이 필요하다고 생각해서 만들었습니다.  
게스트 버튼 한 번으로 10만 USDT를 받고 실제 바이낸스 시세로 선물거래를 체험할 수 있습니다.

---

## 📌 주요 기능

- **실시간 시세** — 바이낸스 WebSocket으로 체결가·호가창 실시간 수신
- **선물 거래** — 시장가·지정가 주문, Isolated·Cross 마진, 레버리지 1~100x
- **자동 체결/청산** — 지정가 자동 체결, 청산가·TP/SL 도달 시 자동 청산
- **실시간 차트** — lightweight-charts 기반, 1분~1일봉, 무한 스크롤
- **포지션 관리** — 증거금 추가, 레버리지 변경, TP/SL 설정, 포지션 공유
- **펀딩비** — 8시간마다 자동 적용
- **튜토리얼** — 첫 로그인 시 퀘스트 방식 인터랙티브 튜토리얼

---

## 🛠 기술 스택

| 구분      | 기술                                              |
| --------- | ------------------------------------------------- |
| Frontend  | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| 상태 관리 | Zustand, TanStack Query                           |
| 차트      | lightweight-charts                                |
| Backend   | Express, TypeScript                               |
| ORM       | Prisma                                            |
| DB        | MySQL                                             |
| 인프라    | AWS EC2 t3.micro, Nginx, PM2                      |
| 배포      | GitHub Actions CI/CD, Cloudflare DNS              |

---

## 🏗 시스템 아키텍처

```
바이낸스 WebSocket
    │
    ▼
Express 백엔드 (WebSocket 서버)
    │
    ├── 체결가/호가창 브로드캐스트 → 프론트 WebSocket
    ├── 체결/청산 이벤트 → 유저별 소켓 Map으로 타겟 전송
    └── 캔들 DB 저장 (인터벌별 보관기간 관리)
    │
    ▼
Next.js 프론트
    │
    ├── Zustand (실시간 소켓 데이터, 인증 상태)
    └── TanStack Query (포지션/주문/자산 서버 상태)
```

---

## 📊 주문/포지션 상태 머신

### 주문 (Order) 상태 전이

```
시장가 주문 생성 ──────────────────────► filled (즉시 체결)

지정가 주문 생성 ──► open ──► filled (조건 충족 시 자동 체결)
                        └──► cancelled (유저 취소 or 잔고 부족)

filled    : 터미널 상태 (더 이상 전이 불가)
cancelled : 터미널 상태 (더 이상 전이 불가)
```

### 포지션 (Position) 상태 전이

```
포지션 생성 ──► open ──► closed     (수동 청산 or TP/SL 도달)
                    └──► liquidated (청산가 도달 → 강제청산)

closed     : 터미널 상태
liquidated : 터미널 상태
```

### 상태 머신 중앙화

상태 전이 규칙을 `backend/src/lib/stateMachine.ts`에 중앙화하여 유효하지 않은 전이 시 에러를 throw합니다.

```typescript
// 예시: filled된 주문 취소 시도 → 에러
transitionOrder("filled", "cancelled");
// Error: 유효하지 않은 주문 상태 전이: filled → cancelled
```

---

## ⚡ 핵심 구현

### 실시간 데이터 흐름

```
바이낸스 WS → 백엔드 가공 → 프론트 소켓 → Zustand store
                                              │
                              tradeData ──────┤ (개별 선택자로 구독)
                              depthData ──────┘ → 필요한 컴포넌트만 리렌더
```

Zustand 구독 최적화: `tradeData` 전체 객체 대신 필요한 값만 선택자로 구독하여 **FutureHeader 54%, TradeInfo 44% 리렌더 감소** (React DevTools Profiler 측정)

### TanStack Query 도입

소켓 이벤트 발생 시 `invalidateQueries`로 관련 쿼리 일괄 무효화. 동일 `queryKey`를 사용하는 컴포넌트들이 캐시를 공유하여 중복 API 호출 제거.

```
소켓 filled/liquidated/ordered/funding 이벤트
    └── invalidateQueries(positions, orders, assets, me)
         └── 마운트된 컴포넌트들 자동 refetch
```

### 소켓 안정성

- **heartbeat**: 30초마다 ping, 10초 내 pong 없으면 강제 재연결
- **재연결 시 userId 재전송**: onopen에서 me API 호출 후 userId 소켓 전송
- **캔들 보완**: 재연결 시 끊긴 구간 캔들 자동 보완

### 캔들 데이터 관리

| 인터벌 | 보관기간 |
| ------ | -------- |
| 1m     | 3일      |
| 5m     | 7일      |
| 15m    | 14일     |
| 30m    | 30일     |
| 1h     | 90일     |
| 4h     | 365일    |
| 1d     | 전체     |

서버 시작 시 DB 데이터 부족하면 바이낸스 API 페이지네이션으로 초기 적재. 스크롤 시 DB에 없는 구간은 바이낸스에서 직접 fetch.

### 정합성 유지

- `prisma.$transaction`: 주문/청산/잔고 변경을 원자적으로 처리
- `currentPrice 0 방어`: 소켓 연결 전 잘못된 청산 방지
- `부동소수점 오차 방어`: locked 잔고 음수 방지 (`Math.max(0, locked)`)
- `지정가 체결 시 잔고 재검증`: 체결 시점 잔고 부족 시 취소 후 환불

---

## 🚀 장애 및 엣지케이스 대응

| 케이스                   | 대응                                             |
| ------------------------ | ------------------------------------------------ |
| 소켓 조용히 끊김         | heartbeat ping/pong                              |
| 재연결 시 캔들 누락      | lastDisconnectedAt 기준 보완                     |
| 서버 시작 시 청산가 0    | currentPrice 0이면 청산 체크 스킵                |
| DB 과부하                | 이전 체크 완료 후 1초 뒤 재실행                  |
| 지정가 체결 시 잔고 부족 | 취소 + 증거금 환불 트랜잭션                      |
| 중복 이벤트              | 이전 데이터와 비교 후 동일하면 브로드캐스트 스킵 |

---

## 🔧 로컬 실행

```bash
# 백엔드
cd backend
npm install
npx prisma migrate dev
npm run dev

# 프론트
cd frontend
npm install
npm run dev
```

### 환경 변수

**backend/.env**

```
DATABASE_URL=mysql://user:password@localhost:3306/bithama
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:3000
PORT=4000
```

**frontend/.env.local**

```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

---

## 📦 배포

- **EC2**: t3.micro, 서울 리전, Swap 2GB
- **Nginx**: 리버스 프록시
- **PM2**: 프로세스 관리
- **GitHub Actions**: main 브랜치 push 시 자동 배포
- **Cloudflare**: DNS, CDN, SSL

```bash
# EC2 배포 시
npx prisma migrate deploy
npx prisma generate
pm2 restart all
```

---

## 📁 프로젝트 구조

```
bithama_future_trade/
├── backend/
│   ├── src/
│   │   ├── routes/       # auth, future, candle
│   │   ├── middleware/   # authMiddleware
│   │   ├── lib/          # stateMachine
│   │   ├── websocket.ts  # 바이낸스 WS + 청산/체결 로직
│   │   ├── candle.ts     # 캔들 동기화
│   │   └── funding.ts    # 펀딩비 스케줄러
│   └── prisma/
│       └── schema.prisma
└── frontend/
    ├── app/
    ├── component/
    │   ├── future/       # 거래소 컴포넌트
    │   ├── tutorial/     # 튜토리얼
    │   └── common/       # 공통 컴포넌트
    ├── store/            # Zustand store
    └── lib/              # queryKeys, queries
```
