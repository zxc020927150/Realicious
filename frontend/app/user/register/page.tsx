"use client";

import registerAd from "@/public/user/register.png";
import Container from "../_components/container";
import ReturnLogin from "../_components/returnLogin";
import VerifyButton from "../_components/verifyButton";
import { user_input } from "@/app/user/_components/button";

import Image from "next/image";
import Cookies from "js-cookie";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

import { registerSchema, RegisterInput } from "@/validations/validate";
import { useUser } from "@/app/context/user";
import { useAlert } from "../context/alert";
import PasswordToggleIcon from "../_components/PasswordToggleIcon";

export default function Register() {

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/user/api`;

  const { showAlert, closeAlert } = useAlert();
  const { setUser } = useUser();

  const [isVerify, setIsVerify] = useState<boolean>(); // 發送驗證碼
  const [registered, setRegistered] = useState<boolean>(); // 已註冊
  const [isVerifyMessage, setIsVerifyMessage] = useState<string>(); // 發送成功訊息
  const [submit, setSubmit] = useState(false); // form 送出
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordCheck, setShowPasswordCheck] = useState(false);

  const router = useRouter();
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { account: "", password: "", verification: "", check: "" },
  });
  const testA = () => {
    setValue("account", "hua870320@gmail.com", { shouldValidate: true });
    setValue("password", "qwe123", { shouldValidate: true });
    setValue("check", "qwe123", { shouldValidate: true });
  };

  // 處理email是否重複，是就發送驗證碼

  const handleSendCode = async (): Promise<boolean> => {
    setIsVerify(false);
    setRegistered(false);
    showAlert("loading", "驗證中...", "請稍候...");
    const isvaild = await trigger("account"); // 驗證 email 欄位格式正確
    const scene = "register";
    if (isvaild) {
      const email = getValues("account");
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
          showAlert("success", "驗證成功", "請到信箱確認驗證碼");
          setIsVerify(true);
          setIsVerifyMessage(data.message || "發送成功");

          return true;
        } else {
          showAlert("error", data.message);
          setRegistered(true);
          setIsVerifyMessage(data.message || "此帳號已註冊過");
          return false;
        }
      } catch (error) {
        showAlert("error", "發送驗證碼失敗...", "無法連接至伺服器");
        console.error("發送驗證碼連線失敗:", error);
        setIsVerify(true);
        setIsVerifyMessage("無法連接至伺服器");
        return false;
      }
    } else {
      showAlert("error", "錯誤", errors.account?.message);
      return false;
    }
  };

  // 表單送出
  const onSubmit = async (data: RegisterInput) => {
    if (submit) return; // 防止快速重複點擊
    setSubmit(true);
    showAlert("loading", "驗證中...", "請稍候...");
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (res.ok && result.success) {
        showAlert("success", "註冊成功", "自動跳轉中...請稍候");
        Cookies.set("token", result.token, { expires: 1 });
        Cookies.set("user", JSON.stringify(result.user), { expires: 1 });
        setUser(result.user);
        setTimeout(() => {
          closeAlert();
          router.refresh();
          router.replace("/user/personal");
        }, 2000);
      } else {
        showAlert("error", "註冊失敗...", result.message);
        setSubmit(false);
      }
    } catch (error) {
      showAlert("error", "註冊失敗...", "無法連接至伺服器");
      console.error("註冊失敗:", error);
      setSubmit(false);
    }
  };

  return (
    <Container>
      <div className="bg-[#FCF9F6] flex justify-center items-center border-3 sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-107.5 h-180 bg-[#FCF9F6] flex flex-col items-center">
          <h1 onClick={testA} className="text-[26px] text-bold my-5">註冊</h1>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col items-center mb-5"
          >
            <div className="flex flex-col items-start mb-4 w-90">
              <label className="text-[20px] mb-2.5" htmlFor="email">
                電子郵件
              </label>
              <div className="relative w-90 flex justify-between">
                <input
                  {...register("account")}
                  className={` w-full h-12.5 text-[16px] px-2 pr-15 ${user_input} ${isVerify ? "bg-yellow-100" : ""}`}
                  type="text"
                  id="email"
                  placeholder="請輸入電子郵件 點擊驗證"
                  disabled={isVerify}
                />
                <VerifyButton className="absolute top-0 right-0" onClick={handleSendCode} child={`驗證`} />
              </div>
              <div className="w-auto h-4">
                {errors.account && (
                  <p className="text-red-500 text-sm mt-1 w-90 text-left">
                    {String(errors.account.message)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start mb-4">
              <label className="text-[20px] mb-2.5" htmlFor="verification">
                驗證碼
              </label>
              <input
                {...register("verification")}
                className={`border w-90 h-12.5 text-[16px] px-2 ${user_input}`}
                type="text"
                id="Verification"
                placeholder="如未收到驗證碼 請60秒後再試"
              />
              <div className="w-auto h-4">
                {errors.verification && (
                  <p className="text-red-500 text-sm mt-1 w-90 text-left">
                    {String(errors.verification.message)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start mb-4">
              <label className="text-[20px] mb-2.5" htmlFor="password">
                密碼
              </label>
              <div className="relative w-full">
                <input
                  {...register("password")}
                  className={`border w-90 h-12.5 text-[16px] px-2 pr-10 ${user_input}`}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="密碼６位元以上 需包含英文與數字"
                />
                <PasswordToggleIcon
                  show={showPassword}
                  onToggle={() => setShowPassword((prev) => !prev)}
                />
              </div>
              <div className="w-auto h-4">
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1 w-90 text-left">
                    {String(errors.password.message)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start mb-4">
              <label className="text-[20px] mb-2.5" htmlFor="password">
                密碼確認
              </label>
              <div className="relative w-full">
                <input
                  {...register("check")}
                  className={`border w-90 h-12.5 text-[16px] px-2 pr-10 ${user_input}`}
                  type={showPasswordCheck ? "text" : "password"}
                  id="passwordcheck"
                  placeholder="請再次輸入密碼"
                />
                <PasswordToggleIcon
                  show={showPasswordCheck}
                  onToggle={() => setShowPasswordCheck((prev) => !prev)}
                />
              </div>
              <div className="w-auto h-4">
                {errors.check && (
                  <p className="text-red-500 text-sm mt-1 w-90 text-left">
                    {String(errors.check.message)}
                  </p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={submit}
              className={`-translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-55 h-15 ${submit ? `bg-gray-400 hover:bg-gray-400` : `bg-[#F02A2D] hover:bg-[#e50004]`}  text-white text-[26px] cursor-pointer  hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
            >
              {submit ? `loading` : `確認送出`}
            </button>
            <div className="mt-4">
              <ReturnLogin />
            </div>
          </form>
        </div>
        <div className="w-0 h-0 lg:w-150 lg:h-180 flex justify-center items-center">
          <Image
            className="object-contain object-bottom h-180 border-black border-l-2 border-dashed"
            src={registerAd}
            alt="廣告"
            width={600}
            height={720}
            priority
          />
        </div>
      </div>
    </Container>
  );
}
