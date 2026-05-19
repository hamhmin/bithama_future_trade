# BITHAMA

> 바이낸스 실시간 데이터 기반 선물거래 플랫폼

[![Live](https://img.shields.io/badge/Live-bithama.com-blue)](https://bithama.com)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![Express](https://img.shields.io/badge/Express-5-lightgrey)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![MySQL](https://img.shields.io/badge/MySQL-8-orange)

<br/>

## 📌 소개

게스트 버튼 한 번으로 **10만 USDT**를 받고 실제 바이낸스 시세로 선물거래를 체험할 수 있는 플랫폼입니다.

실제 체결 엔진 없이 바이낸스 현재가 기준으로 즉시 체결 처리하며, 펀딩비 정산·청산·TP/SL 등 실제 거래소 구조를 재현했습니다.

[ 전체 화면 - 데스크탑 ]
<img width="1906" height="918" alt="image" src="https://github.com/user-attachments/assets/c00d18c5-6dbd-436d-a5d6-179b280655fb" />
<br/>
[ 포지션탭 ]
<img width="1432" height="243" alt="image" src="https://github.com/user-attachments/assets/f292af06-fcbc-4720-9e40-8d78c4399c5f" />
<br/>
[ 튜토리얼 spotlight ]
<img width="700" height="478" alt="image" src="https://github.com/user-attachments/assets/6f37ebea-f232-4089-b2fe-da8a42b1d0a4" />
<img width="1496" height="790" alt="image" src="https://github.com/user-attachments/assets/c7e7c849-a660-489e-a0c2-9391b2bc51ca" />
<br/>
[ 모바일 화면 ]
<img width="345" height="724" alt="image" src="https://github.com/user-attachments/assets/871f070f-3d58-4593-89ba-5613629e5138" />

<br/>

## 🛠 기술 스택

| 구분 | 기술 |
|---|---|
| **Frontend** | Next.js 15 (App Router) · TypeScript · React · Tailwind CSS · Zustand · TanStack Query · lightweight-charts |
| **Backend** | Express 5 · TypeScript · Prisma · MySQL |
| **Infra** | AWS EC2 · Nginx · PM2 · GitHub Actions · Cloudflare |
| **실시간** | WebSocket (ws) |

<br/>

## 📁 프로젝트 구조

```
bithama/
├── frontend/          # Next.js App Router
│   ├── app/
│   │   ├── (main)/
│   │   │   ├── future/        # 거래소 메인
│   │   │   ├── markets/       # 마켓
│   │   │   ├── profile/       # 프로필
│   │   │   └── assets/        # 자산
│   │   ├── login/
│   │   └── signup/
│   └── component/
│       ├── future/            # 거래소 컴포넌트
│       │   ├── OrderBook/     # 호가창
│       │   ├── Chart/         # 캔들차트
│       │   ├── OrderForm/     # 주문폼
│       │   └── PositionTable/ # 포지션
│       └── common/
│
└── backend/           # Express + WebSocket
    ├── src/
    │   ├── routes/
    │   │   ├── auth.ts        # 인증
    │   │   ├── future.ts      # 주문·포지션·잔고
    │   │   └── candle.ts      # 캔들 데이터
    │   ├── websocket.ts       # 바이낸스 WS · 브로드캐스트
    │   ├── candle.ts          # 캔들 파이프라인
    │   ├── funding.ts         # 펀딩비 스케줄러
    │   ├── stateMachine.ts    # 주문 상태 머신
    │   └── index.ts
    └── prisma/
        └── schema.prisma
```

<br/>

## ⚡ 핵심 구현

### 트레이딩 터미널
- 호가창 실시간 렌더링 (누적 물량 바, 매수/매도 색상 분기, 클릭 시 지정가 자동 입력)
- lightweight-charts 기반 캔들차트 (1분~1일봉, 무한 스크롤)
- Next.js SSR로 캔들 초기 데이터 선적재 → 차트 깜빡임 제거
- 차트 위 포지션 / 주문 / TP / SL / 청산가 라인 실시간 표시
- 시장가·지정가 주문, Isolated/Cross 마진, 레버리지 최대 100x, TP/SL, 부분 청산

### 성능 최적화
- Zustand 선택자 구독으로 리렌더 최대 **54% 감소** (React DevTools Profiler 측정)
  - FutureHeader `131회 → 60회`
  - TradeInfo `104회 → 58회`
  - OrderBook `176회 → 132회`
- TanStack Query로 중복 API 호출 제거, 소켓 이벤트 기반 캐시 동기화
- 바이낸스 `@depth10` 스트림으로 호가창 DOM 각 10개로 자연 제한
- 호가창 JSON 문자열 비교로 동일 데이터 중복 브로드캐스트 차단

### 소켓 안정성
- heartbeat: 30초마다 ping 전송 → 10초 내 pong 없으면 강제 재연결
- 재연결 시 userId 재인증 메시지 전송 → 실시간 알림 수신 복구
- 끊긴 구간 캔들 자동 보완
- 청산·체결 체크를 재귀 `setTimeout`으로 직렬 처리 → 고부하 환경 DB 과부하 방지

### 정합성 유지
- `prisma.$transaction`으로 주문 / 청산 / 잔고 변경 원자적 처리
- 펀딩비 정산도 트랜잭션 적용 → 잔고·증거금·이력 동시 처리
- 주문 상태 머신 (`stateMachine.ts`) 중앙화 → 유효하지 않은 상태 전이 방지
- `currentPrice` 0 방어, 부동소수점 오차 방어 (`Math.max(0, locked)`)

### 보안
- JWT를 `httpOnly` 쿠키로 전송 → XSS 방어
- bcrypt 해시 암호화 + 서버사이드 입력 검증
- `express-rate-limit`: 로그인 15분/10회, 주문 API 1초/1회
- CORS origin 화이트리스트

### 실제 거래소 구조 재현
- 바이낸스 펀딩비율 연동 → 8시간마다 자동 정산 (00:00 / 08:00 / 16:00 UTC)
- Long/Short 방향 + 펀딩비율 부호에 따른 차감/지급 로직
- Isolated / Cross 마진 청산가 계산 공식 각각 구현
- 레버리지 상향 시 잉여 증거금 잔고 자동 환원

<br/>

## 🚀 로컬 실행

### 사전 요구사항
- Node.js 18+
- MySQL 8+

### 백엔드

```bash
cd backend
npm install

# .env 설정
cp .env.example .env
# DATABASE_URL, JWT_SECRET, FRONTEND_URL 입력

npx prisma migrate deploy
npm run dev
```

### 프론트엔드

```bash
cd frontend
npm install

# .env.local 설정
cp .env.example .env.local
# NEXT_PUBLIC_WS_URL, NEXT_PUBLIC_API_URL 입력

npm run dev
```

<br/>

## 🔑 환경변수

### backend `.env`

```env
DATABASE_URL="mysql://user:password@localhost:3306/bithama"
JWT_SECRET="your_jwt_secret"
FRONTEND_URL="http://localhost:3000"
PORT=4000
```

### frontend `.env.local`

```env
NEXT_PUBLIC_WS_URL="ws://localhost:4000"
NEXT_PUBLIC_API_URL="http://localhost:4000"
```

<br/>

## 📦 배포

GitHub Actions로 `main` 브랜치 push 시 EC2 자동 배포됩니다.

```
push to main
  → git pull
  → 백엔드 빌드 (npm install → prisma migrate deploy → npm run build → pm2 restart)
  → 프론트 빌드 (npm install → npm run build → pm2 restart)
```

<br/>

## 📄 라이선스

MIT
