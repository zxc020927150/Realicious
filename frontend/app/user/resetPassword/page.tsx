"use client";

import Container from "../_components/container";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  ResetPasswordInput,
} from "@/validations/validate";
import { useAlert } from "../context/alert";
import { user_input } from "@/app/user/_components/button";
import PasswordToggleIcon from "../_components/PasswordToggleIcon";
import { RiLockPasswordFill } from "react-icons/ri";

export default function ForgetPassword() {
  const { showAlert, closeAlert } = useAlert();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/user/api`;

  const [submit, setSubmit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", check: "" },
  });

  // 表單送出
  const onSubmit = async (data: ResetPasswordInput) => {
    if (submit) return; // 防止快速重複點擊
    showAlert("loading", "驗證中...", "請稍候");
    if (!token || !email) {
      showAlert(
        "error",
        "異常狀態",
        "驗證憑證已失效或網址不正確，請重新申請驗證碼。",
      );
      setTimeout(() => {
        router.replace("/user/forgetPassword"); // 丟回輸入驗證碼那一頁
        return;
      }, 2000);
    }
    setSubmit(true);
    try {
      const res = await fetch(`${API_URL}/resetpassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          resetToken: token,
          newPassword: data.password,
        }),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        showAlert("success", "重置成功", "請重新登入");
        setTimeout(() => {
          closeAlert();
          router.replace("/user/login");
        }, 2500);
      } else {
        showAlert("error", "修改失敗", result.message);
        setSubmit(false);
      }
    } catch (error) {
      console.error("發送驗證碼連線失敗:", error);
      showAlert("error", "連線伺服器失敗，請稍後再試");
      setSubmit(false);
    }
  };

  return (
    <Container>
      <div className="flex justify-center items-center sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-108 h-180 bg-[#FCF9F6] border-2 flex flex-col items-center">
          <h1 className="flex justify-center items-center text-[24px] my-10">
            <RiLockPasswordFill className="mr-2"/>
            重置密碼
          </h1>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col items-center mb-5"
          >
            <div className="flex flex-col items-start mb-5">
              <label className="text-[20px] mb-2" htmlFor="password">
                密碼
              </label>
              <div className="relative w-full">
                <input
                  {...register("password", { required: "這是必填欄位" })}
                  className={`${errors.password ? "border-red-500" : ""} ${user_input} w-90 h-12 text-[16px] px-2 pr-10`}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="密碼６位元以上 需包含英文與數字"
                />
                <PasswordToggleIcon
                  show={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                />
              </div>
            </div>
            <div className="flex flex-col items-start mb-1">
              <label className="text-[20px] mb-2" htmlFor="check">
                密碼確認
              </label>
              <div className="relative w-full">
                <input
                  {...register("check", { required: "這是必填欄位" })}
                  className={`${errors.check ? "border-red-500" : ""} ${user_input} w-90 h-12 text-[16px] px-2 pr-10`}
                  type={showPasswordCheck ? "text" : "password"}
                  id="check"
                  placeholder="請再次輸入密碼"
                />
                <PasswordToggleIcon
                  show={showPasswordCheck}
                  onToggle={() => setShowPasswordCheck((prev) => !prev)}
                />
              </div>
            </div>
            <div className="w-auto h-4 mb-4">
              {errors.check && (
                <p className="text-red-500 text-sm mt-1 w-90 text-left">
                  {String(errors.check.message)}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={submit}
              className={`-translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-55 h-15 ${submit ? `bg-gray-400 hover:bg-gray-400` : `bg-[#F02A2D] hover:bg-[#e50004]`}  text-white text-[26px] cursor-pointer  hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
            >
              {submit ? `loading` : `確認送出`}
            </button>
          </form>
        </div>
      </div>
    </Container>
  );
}
