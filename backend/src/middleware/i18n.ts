import type { NextFunction, Request, Response } from "express";

type Locale = "ko" | "en" | "ja";
type TranslationMap = Record<string, string>;

const translations: Record<Exclude<Locale, "ko">, TranslationMap> = {
  en: {
    "로그인이 필요해요.": "Please log in.",
    "유효하지 않은 토큰이에요.": "Invalid token.",
    "올바른 이메일 형식이 아니에요.": "Please enter a valid email address.",
    "비밀번호는 8자 이상, 영문+숫자 조합이어야 해요.":
      "Password must be at least 8 characters and include letters and numbers.",
    "닉네임은 2자 이상 20자 이하로 입력해주세요.":
      "Nickname must be between 2 and 20 characters.",
    "이미 사용중인 이메일이에요.": "This email is already in use.",
    "이미 사용중인 닉네임이에요.": "This nickname is already in use.",
    "회원가입 성공!": "Sign up complete!",
    "서버 오류": "Server error",
    "로그인 시도가 너무 많아요. 잠시 후 다시 시도해주세요.":
      "Too many login attempts. Please try again later.",
    "이메일 또는 비밀번호가 틀렸어요.": "Email or password is incorrect.",
    "로그인 성공!": "Login successful!",
    "로그아웃 성공!": "Logout successful!",
    "이메일과 비밀번호를 입력해주세요.": "Please enter email and password.",
    "닉네임을 입력해주세요.": "Please enter a nickname.",
    "모든 항목을 입력해주세요.": "Please fill in all fields.",
    "오류가 발생했어요.": "Something went wrong.",
    "로그인 실패": "Login failed.",
    "회원가입 실패": "Sign up failed.",
    "게스트 로그인 실패": "Guest login failed.",
    "회원가입 성공! 로그인해주세요.": "Sign up complete! Please log in.",
    "닉네임 변경 완료!": "Nickname updated!",
    "유저를 찾을 수 없어요.": "User not found.",
    "현재 비밀번호가 틀렸어요.": "Current password is incorrect.",
    "비밀번호 변경 완료!": "Password updated!",
    "티커 로딩 실패": "Failed to load ticker.",
    "프리미엄 인덱스 로딩 실패": "Failed to load premium index.",
    "전체 티커 로딩 실패": "Failed to load tickers.",
    "캔들 조회 실패": "Failed to load candles.",
    "요청이 너무 많아요. 잠시 후 다시 시도해주세요.":
      "Too many requests. Please try again later.",
    "필수 값이 빠졌어요.": "Required values are missing.",
    "side는 long 또는 short이어야 해요.": "Side must be long or short.",
    "수량은 0보다 커야 해요.": "Size must be greater than 0.",
    "type은 market 또는 limit이어야 해요.":
      "Type must be market or limit.",
    "marginType은 isolated 또는 cross이어야 해요.":
      "Margin type must be isolated or cross.",
    "지정가 주문엔 price가 필요해요.": "Limit orders require a price.",
    "지갑이 없어요.": "Wallet not found.",
    "현재가를 가져올 수 없어요.": "Could not fetch current price.",
    "잔고가 부족해요. (수수료 포함)": "Insufficient balance including fees.",
    "시장가 주문이 체결됐어요!": "Market order filled!",
    "시장가 주문 체결!": "Market order filled!",
    "지정가 주문 등록됐어요!": "Limit order placed!",
    "지정가 주문 등록!": "Limit order placed!",
    "권한이 없어요.": "You do not have permission.",
    "주문을 찾을 수 없어요.": "Order not found.",
    "취소할 수 없는 주문이에요.": "This order cannot be canceled.",
    "주문 취소 완료!": "Order canceled!",
    "포지션을 찾을 수 없어요.": "Position not found.",
    "이미 청산된 포지션이에요.": "This position is already closed.",
    "올바른 수량을 입력해주세요.": "Please enter a valid size.",
    "청산 완료!": "Position closed!",
    "전체 청산 완료!": "Position fully closed!",
    "부분 청산 완료!": "Position partially closed!",
    "추가할 증거금을 입력해주세요.": "Please enter margin to add.",
    "잔고가 부족해요.": "Insufficient balance.",
    "증거금 추가 완료!": "Margin added!",
    "레버리지를 입력해주세요.": "Please enter leverage.",
    "레버리지 변경 완료!": "Leverage updated!",
    "잘못된 마진타입이에요.": "Invalid margin type.",
    "포지션이나 주문이 있으면 마진타입을 변경할 수 없어요.":
      "You cannot change margin type while positions or orders exist.",
    "포지션 보유 중엔 마진타입을 변경할 수 없어요. 모든 포지션을 청산 후 변경해주세요.":
      "You cannot change margin type while holding a position. Close all positions first.",
    "마진타입 변경 완료!": "Margin type updated!",
    "Long TP는 진입가보다 높아야 해요.":
      "Long TP must be higher than entry price.",
    "Short TP는 진입가보다 낮아야 해요.":
      "Short TP must be lower than entry price.",
    "Long SL은 진입가보다 낮아야 해요.":
      "Long SL must be lower than entry price.",
    "Short SL은 진입가보다 높아야 해요.":
      "Short SL must be higher than entry price.",
    "TP/SL 설정 완료!": "TP/SL updated!",
    "지갑을 찾을 수 없어요.": "Wallet not found.",
    "펀딩비가 적용됐어요!": "Funding fee applied!",
    "지정가 주문이 체결됐어요!": "Limit order filled!",
    "포지션이 강제청산됐어요!": "Position was liquidated!",
    "TP 목표가에 도달해 청산됐어요!": "TP reached. Position closed!",
    "SL 손절가에 도달해 청산됐어요!": "SL reached. Position closed!",
  },
  ja: {
    "로그인이 필요해요.": "ログインが必要です。",
    "유효하지 않은 토큰이에요.": "無効なトークンです。",
    "올바른 이메일 형식이 아니에요.": "正しいメール形式で入力してください。",
    "비밀번호는 8자 이상, 영문+숫자 조합이어야 해요.":
      "パスワードは8文字以上で、英字と数字を含めてください。",
    "닉네임은 2자 이상 20자 이하로 입력해주세요.":
      "ニックネームは2文字以上20文字以下で入力してください。",
    "이미 사용중인 이메일이에요.": "このメールはすでに使用されています。",
    "이미 사용중인 닉네임이에요.": "このニックネームはすでに使用されています。",
    "회원가입 성공!": "登録が完了しました！",
    "서버 오류": "サーバーエラー",
    "로그인 시도가 너무 많아요. 잠시 후 다시 시도해주세요.":
      "ログイン試行が多すぎます。しばらくしてから再試行してください。",
    "이메일 또는 비밀번호가 틀렸어요。": "メールまたはパスワードが間違っています。",
    "이메일 또는 비밀번호가 틀렸어요.": "メールまたはパスワードが間違っています。",
    "로그인 성공!": "ログイン成功！",
    "로그아웃 성공!": "ログアウト成功！",
    "이메일과 비밀번호를 입력해주세요.": "メールとパスワードを入力してください。",
    "닉네임을 입력해주세요.": "ニックネームを入力してください。",
    "모든 항목을 입력해주세요.": "すべての項目を入力してください。",
    "오류가 발생했어요.": "エラーが発生しました。",
    "로그인 실패": "ログインに失敗しました。",
    "회원가입 실패": "登録に失敗しました。",
    "게스트 로그인 실패": "ゲストログインに失敗しました。",
    "회원가입 성공! 로그인해주세요.": "登録完了！ログインしてください。",
    "닉네임 변경 완료!": "ニックネームを変更しました！",
    "유저를 찾을 수 없어요.": "ユーザーが見つかりません。",
    "현재 비밀번호가 틀렸어요.": "現在のパスワードが間違っています。",
    "비밀번호 변경 완료!": "パスワードを変更しました！",
    "티커 로딩 실패": "ティッカーの読み込みに失敗しました。",
    "프리미엄 인덱스 로딩 실패": "プレミアム指数の読み込みに失敗しました。",
    "전체 티커 로딩 실패": "全ティッカーの読み込みに失敗しました。",
    "캔들 조회 실패": "ローソク足の取得に失敗しました。",
    "요청이 너무 많아요. 잠시 후 다시 시도해주세요.":
      "リクエストが多すぎます。しばらくしてから再試行してください。",
    "필수 값이 빠졌어요.": "必須項目が不足しています。",
    "side는 long 또는 short이어야 해요.": "sideはlongまたはshortである必要があります。",
    "수량은 0보다 커야 해요.": "数量は0より大きい必要があります。",
    "type은 market 또는 limit이어야 해요。": "typeはmarketまたはlimitである必要があります。",
    "type은 market 또는 limit이어야 해요.": "typeはmarketまたはlimitである必要があります。",
    "marginType은 isolated 또는 cross이어야 해요.":
      "marginTypeはisolatedまたはcrossである必要があります。",
    "지정가 주문엔 price가 필요해요.": "指値注文にはpriceが必要です。",
    "지갑이 없어요.": "ウォレットがありません。",
    "현재가를 가져올 수 없어요.": "現在価格を取得できません。",
    "잔고가 부족해요. (수수료 포함)": "手数料込みの残高が不足しています。",
    "시장가 주문이 체결됐어요!": "成行注文が約定しました！",
    "시장가 주문 체결!": "成行注文が約定しました！",
    "지정가 주문 등록됐어요!": "指値注文を登録しました！",
    "지정가 주문 등록!": "指値注文を登録しました！",
    "권한이 없어요.": "権限がありません。",
    "주문을 찾을 수 없어요.": "注文が見つかりません。",
    "취소할 수 없는 주문이에요.": "この注文はキャンセルできません。",
    "주문 취소 완료!": "注文をキャンセルしました！",
    "포지션을 찾을 수 없어요.": "ポジションが見つかりません。",
    "이미 청산된 포지션이에요.": "このポジションはすでに決済されています。",
    "올바른 수량을 입력해주세요.": "正しい数量を入力してください。",
    "청산 완료!": "決済完了！",
    "전체 청산 완료!": "全決済完了！",
    "부분 청산 완료!": "部分決済完了！",
    "추가할 증거금을 입력해주세요.": "追加する証拠金を入力してください。",
    "잔고가 부족해요.": "残高が不足しています。",
    "증거금 추가 완료!": "証拠金を追加しました！",
    "레버리지를 입력해주세요.": "レバレッジを入力してください。",
    "레버리지 변경 완료!": "レバレッジを変更しました！",
    "잘못된 마진타입이에요.": "無効なマージンタイプです。",
    "포지션이나 주문이 있으면 마진타입을 변경할 수 없어요.":
      "ポジションまたは注文がある場合、マージンタイプは変更できません。",
    "포지션 보유 중엔 마진타입을 변경할 수 없어요. 모든 포지션을 청산 후 변경해주세요.":
      "ポジション保有中はマージンタイプを変更できません。すべてのポジションを決済してから変更してください。",
    "마진타입 변경 완료!": "マージンタイプを変更しました！",
    "Long TP는 진입가보다 높아야 해요.": "LongのTPは参入価格より高くしてください。",
    "Short TP는 진입가보다 낮아야 해요.": "ShortのTPは参入価格より低くしてください。",
    "Long SL은 진입가보다 낮아야 해요.": "LongのSLは参入価格より低くしてください。",
    "Short SL은 진입가보다 높아야 해요.": "ShortのSLは参入価格より高くしてください。",
    "TP/SL 설정 완료!": "TP/SLを設定しました！",
    "지갑을 찾을 수 없어요.": "ウォレットが見つかりません。",
    "펀딩비가 적용됐어요!": "資金調達料が適用されました！",
    "지정가 주문이 체결됐어요!": "指値注文が約定しました！",
    "포지션이 강제청산됐어요!": "ポジションが強制決済されました！",
    "TP 목표가에 도달해 청산됐어요!": "TP目標価格に到達し決済されました！",
    "SL 손절가에 도달해 청산됐어요!": "SL損切り価格に到達し決済されました！",
  },
};

function getLocale(req: Request): Locale {
  const headerLocale =
    req.header("x-bithama-locale") ?? req.header("accept-language") ?? "";
  const cookieLocale = req.cookies?.bithama_locale;
  const value = (headerLocale || cookieLocale || "ko").slice(0, 2);

  if (value === "en" || value === "ja" || value === "ko") return value;
  return "ko";
}

function translateMessage(locale: Locale, message: string) {
  if (locale === "ko") return message;

  const dictionary = translations[locale];
  const exact = dictionary[message];
  if (exact) return exact;

  const isolatedMatch = message.match(
    /^Isolated는 현재 레버리지\((\d+)x\)보다 높게만 설정 가능해요\.$/,
  );
  if (isolatedMatch) {
    return locale === "ja"
      ? `Isolatedは現在のレバレッジ(${isolatedMatch[1]}x)より高く設定してください。`
      : `Isolated leverage can only be set higher than the current ${isolatedMatch[1]}x.`;
  }

  return message;
}

function translateBody(locale: Locale, body: unknown): unknown {
  if (!body || typeof body !== "object") return body;

  if (Array.isArray(body)) {
    return body.map((item) => translateBody(locale, item));
  }

  const next: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const [key, value] of Object.entries(next)) {
    if (key === "message" && typeof value === "string") {
      next[key] = translateMessage(locale, value);
    } else if (value && typeof value === "object") {
      next[key] = translateBody(locale, value);
    }
  }

  return next;
}

export function i18nMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const locale = getLocale(req);
  const originalJson = res.json.bind(res);

  res.json = (body?: unknown) => originalJson(translateBody(locale, body));

  next();
}
