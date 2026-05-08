// frontend/component/tutorial/useTutorial.ts
"use client";

import { useState, useEffect, startTransition, RefObject } from "react";
import { useFutureStore } from "@/store/useFutureStore";
import { TUTORIAL_STEPS } from "./tutorialSteps";

const TUTORIAL_KEY = "tutorial_completed";

export type TutorialRefs = {
  leverageBtn: RefObject<HTMLButtonElement | null>;
  sizeInput: RefObject<HTMLInputElement | null>;
  submitBtn: RefObject<HTMLButtonElement | null>;
  closeBtn: RefObject<HTMLButtonElement | null>;
};

export function useTutorial(tutorialCompleted?: boolean) {
  const authStatus = useFutureStore((state) => state.authStatus);
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);

  // 튜토리얼 시작 조건 체크
  useEffect(() => {
    if (authStatus === "loading") return;
    // 로그아웃 시 초기화
    if (authStatus === "guest") {
      startTransition(() => {
        setIsCompleted(false);
        setIsActive(false);
        setShowStartModal(false);
        setCurrentStep(0);
      });
      return;
    }
    if (authStatus !== "logged-in") return; // 로그아웃 상태면 스킵
    if (tutorialCompleted === undefined) return; // me 쿼리 로딩 중 방어
    if (isCompleted) return; // 완료 후 재실행 방지
    // DB 기준으로만 체크
    if (tutorialCompleted === false) {
      startTransition(() => {
        setShowStartModal(true);
      });
    }
  }, [authStatus, tutorialCompleted, isCompleted]);
  const startTutorial = () => {
    setShowStartModal(false);
    setIsActive(true);
  };

  const next = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // console.log("complete 호출!");

      complete();
    }
  };

  const skip = () => {
    setShowStartModal(false);
    setIsActive(false);

    // DB에 저장
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/tutorial-complete`, {
      method: "PATCH",
      credentials: "include",
    });
    setIsActive(false);
  };

  const restart = () => {
    localStorage.removeItem(TUTORIAL_KEY);
    setCurrentStep(0);
    setIsCompleted(false);
    setIsActive(true);
  };
  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };
  const complete = () => {
    // DB에만 저장 (게스트/로그인 둘 다)
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/tutorial-complete`, {
      method: "PATCH",
      credentials: "include",
    });
    setCurrentStep(TUTORIAL_STEPS.length - 1);
    setIsActive(true);
    setShowCompleteModal(true);
  };

  const confirmComplete = () => {
    setShowCompleteModal(false);
    setIsActive(false);
    setIsCompleted(true);
  };
  return {
    isActive,
    currentStep,
    step: TUTORIAL_STEPS[currentStep],
    totalSteps: TUTORIAL_STEPS.length,
    isCompleted,
    showCompleteModal,
    showStartModal,
    next,
    skip,
    complete,
    restart,
    prev,
    confirmComplete,
    startTutorial,
  };
}
