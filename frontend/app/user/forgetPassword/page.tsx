"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAlert } from "../context/alert";

import Container from "../_components/container";
import ReturnLogin from "../_components/returnLogin";
import VerifyButton from "../_components/verifyButton";
import { user_input } from "@/app/user/_components/button";
import {
  forgetPasswordSchema,
  forgetPasswordInput,
} from "@/validations/validate";

import { FaUnlockKeyhole } from "react-icons/fa6";

export default function ForgetPassword() {

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/user/api`;

  const router = useRouter();
  const { showAlert, closeAlert } = useAlert();

  const [isVerify, setIsVerify] = useState<boolean>(); // 發送驗證碼
  const [isVerifyMessage, setIsVerifyMessage] = useState<string>(); // 發送成功訊息
  const [submit, setSubmit] = useState(false); // 表單送出中的按鈕的效果

  // 使用 RHF
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgetPasswordSchema),
    defaultValues: { email: "", code: "" },
  });

const testA = () => {
    setValue("email", "hua870320@gmail.com", { shouldValidate: true });
  };

  const scene = "forgot-password";

  const handleSendCode = async (): Promise<boolean> => {
    setIsVerify(false);
    showAlert("loading", "驗證中...", "請稍候");
    const isvaild = await trigger("email"); // 驗證 email 欄位格式正確
    if (isvaild) {
      const email = getValues("email");
      try {
        const res = await fetch(`${API_URL}/verification/send-code`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email, scene: scene }),
        });
        const data = await res.json();

        if (res.ok && data.success) {
          setIsVerify(true);
          showAlert("success", "發送成功", "請到信箱確認驗證碼");
          setIsVerifyMessage(data.message || "驗證碼已成功寄出，請至信箱收取");
          return true;
        } else {
          showAlert("error", "發送失敗", "伺服器錯誤 請稍後再試");
          setIsVerifyMessage(data.message || "伺服器錯誤，無法發送驗證碼");
          return false;
        }
      } catch (error) {
        console.error("發送驗證碼連線失敗:", error);
        showAlert("error", "發送失敗", "伺服器錯誤 請稍後再試");
        setIsVerify(true);
        setIsVerifyMessage("伺服器錯誤，無法發送驗證碼");
        return false;
      }
    } else {
      showAlert("error", "錯誤", errors.email?.message);
      return false;
    }
  };

  // 表單送出
  const onSubmit = async (data: forgetPasswordInput) => {
    if (submit) return; // 防止快速重複點擊
    setSubmit(true);
    showAlert("loading", "驗證中...", "請稍候");

    try {
      const res = await fetch(`${API_URL}/verification/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // data 裡面應該本來就有包含 email 和 code
        body: JSON.stringify({ ...data, scene: scene }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        showAlert("success", "驗證成功", "請稍候...自動跳轉中");
        setTimeout(() => {
          // 1. 從後端回傳的結果中，把我們剛剛做好的 resetToken 撈出來
          const token = result.resetToken;
          const email = data.email; // 或者是從你前端 state 拿到的 email
          closeAlert();
          // 2. 跳轉時，把 token 和 email 用 Query String 帶到重設密碼頁面
          // 網址會變成：/user/resetPassword?token=xxxx&email=xxx@example.com
          router.replace(
            `/user/resetPassword?token=${token}&email=${encodeURIComponent(email)}`,
          );
        }, 2000);
      } else {
        showAlert("error", "驗證錯誤", "請確認驗證碼是否正確");
        setSubmit(false);
      }
    } catch (error) {
      console.error("發送驗證碼連線失敗:", error);
      showAlert("error", "連線異常", "連線伺服器失敗，請稍後再試");
      setSubmit(false);
    }
  };

  return (
    <Container>
      <div className="w-110 h-180 bg-[#FCF9F6] sm:border-2 flex flex-col items-center sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <h1 onClick={testA} className="flex items-center justify-center text-[24px] my-10">
          <FaUnlockKeyhole className="mr-2" />
          忘記密碼
        </h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-center mb-5"
        >
          <div className="w-90 flex flex-col justify-between">
            <label className="text-[20px] mb-2.5" htmlFor="verification">
              電子郵件
            </label>
            <div className="flex relative justify-between">
              <input
                {...register("email")}
                className={`${user_input} w-full h-12.5 text-[16px] px-2 ${isVerify ? "bg-yellow-100" : ""}`}
                type="text"
                id="email"
                placeholder="請輸入電子郵件 點擊驗證"
                disabled={isVerify}
              />
              <VerifyButton
                className="absolute top-0 right-0"
                onClick={handleSendCode}
                child={`驗證`}
              />
            </div>
          </div>
          <div className="w-auto h-4 mb-4">
            {errors.email && (
              <p className="text-red-500 text-sm mt-1 w-90 text-left">
                {String(errors.email.message)}
              </p>
            )}
            {/* {isVerify ? <p>{isVerifyMessage}</p> : ""} */}
          </div>

          <div className="flex flex-col items-start mb-4">
            <label className="text-[20px] mb-2.5" htmlFor="verification">
              驗證碼
            </label>
            <input
              {...register("code")}
              className={`${user_input} w-90 h-12.5 text-[16px] px-2`}
              type="text"
              id="Verification"
              placeholder="如未收到驗證碼 請60秒後再試"
            />
            <div className="w-auto h-4">
              {errors.code && (
                <p className="text-red-500 text-sm mt-1 w-90 text-left">
                  {String(errors.code.message)}
                </p>
              )}
            </div>
          </div>
          <button
            type="submit"
            disabled={submit}
            className={` border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-55 h-15 
                      ${submit ? `bg-gray-400 hover:bg-gray-400` : `bg-[#F02A2D] hover:bg-[#e50004]`} 
                      text-white text-[26px] cursor-pointer  hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                      -translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0`}
          >
            {submit ? `登入中...` : `確認送出`}
          </button>
        </form>

        <div>
          <ReturnLogin />
        </div>
      </div>
    </Container>
  );
}
