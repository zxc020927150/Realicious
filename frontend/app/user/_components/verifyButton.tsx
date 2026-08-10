"use client";
import { useState, useEffect } from "react";

interface VerifyButtonProps {
  onClick: () => Promise<boolean>;
  child: React.ReactNode;
  className?:string;
}

export default function VerifyButton({ onClick, child ,className="" }: VerifyButtonProps) {
  const [seconds, setSeconds] = useState<number>(0);

  useEffect(() => {
    if (seconds === 0) return;
    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const handleSend = async () => {
    if (seconds > 0) return;
    const isExternalVaild = await onClick();
    if (isExternalVaild) {
      setSeconds(58);
    }
  };
  const isCounting = seconds > 0;

  return (
    <button
      className={`${className} w-12.5 h-12.5 border-2 border-black -translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0 ${isCounting ? "bg-[#cdcaca] cursor-not-allowed shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] translate-x-0 translate-y-0" : "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white cursor-pointer hover:shadow-[0px_0px_0px_0px_rgba(0,0,0,1)] hover:bg-[#FCF9F6]"}`}
      onClick={(e) => {
        e.preventDefault();
        handleSend();
      }}
      type="button"
    >
      {isCounting ? `${seconds}秒` : `${child}`}
    </button>
  );
}
