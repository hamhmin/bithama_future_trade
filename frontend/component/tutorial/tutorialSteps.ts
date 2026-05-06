export type TutorialStep = {
  id: string;
  title: string;
  description: string;
  targetRef: string;
  tooltipPosition: "top" | "bottom" | "left" | "right";
  trigger: "click" | "input" | "submit" | "complete";
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "leverage_open",
    title: "1단계: 레버리지 버튼 클릭",
    description:
      "레버리지는 내 증거금의 몇 배로 거래할지 결정해요. 높을수록 수익과 손실이 커져요. 레버리지 버튼을 클릭해보세요!",
    targetRef: "leverageBtn",
    tooltipPosition: "bottom",
    trigger: "click",
  },
  {
    id: "leverage_set",
    title: "2단계: 레버리지 설정",
    targetRef: "leverageModal",
    description: "원하는 레버리지를 선택하고 확인을 눌러주세요!",
    tooltipPosition: "bottom",
    trigger: "click",
  },
  {
    id: "size",
    title: "3단계: 수량 입력",
    description:
      "거래할 BTC 수량을 입력해요. 아래 25/50/75/100% 버튼으로 빠르게 입력할 수도 있어요!",
    targetRef: "sizeArea",
    tooltipPosition: "bottom",
    trigger: "input",
  },
  {
    id: "submit",
    title: "4단계: 주문하기",
    description:
      "Long은 가격이 오를 때, Short은 가격이 내릴 때 수익이 나요. 주문 버튼을 눌러보세요!",
    targetRef: "submitBtn",
    tooltipPosition: "top",
    trigger: "submit",
  },
  {
    id: "complete",
    title: "🎉 첫 거래 완료!",
    description:
      "포지션/거래내역/자산 탭에서 방금 거래한 내역을 확인할 수 있어요!",
    targetRef: "positionPanel",
    tooltipPosition: "top",
    trigger: "complete",
  },
];
