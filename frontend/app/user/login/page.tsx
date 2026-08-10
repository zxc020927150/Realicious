"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useForm, type FieldErrors } from "react-hook-form";
import { useState, useEffect } from "react";
import { useUser } from "@/app/context/user";
import { useAlert } from "../context/alert";

import Link from "next/link";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";

import Container from "../_components/container";
import loginAd from "@/public/user/login.png";
import google from "@/public/user/google-logo.svg";
import { button_shadow, user_input } from "@/app/user/_components/button";
import { loginSchema, LoginInput } from "@/validations/validate";
import { RiLoginBoxLine } from "react-icons/ri";
import PasswordToggleIcon from "../_components/PasswordToggleIcon";
import Banner from './_componets/banner'

export default function Login() {
  const router = useRouter();
  const { login } = useUser();
  const { showAlert, closeAlert } = useAlert();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const requestedNext = searchParams.get("next");
  const nextPath = requestedNext?.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : "/";
  
  useEffect(() => {
    if (error === "server_error") {
      // 觸發 Alert 提示
      showAlert("error", "登入異常", "Google 驗證失敗，請重新登入。");
      router.replace("/user/login", { scroll: false });
    }
    if (error === "user_not_found") {
      // 觸發 Alert 提示
      showAlert("error", "登入異常", "用戶不存在");
      router.replace("/user/login", { scroll: false });
    }
    if (error === "oauth_failed") {
      // 觸發 Alert 提示
      showAlert("error", "登入異常", "請稍後再試");
      router.replace("/user/login", { scroll: false });
    }
  }, [error, showAlert, router]); // 當 error 存在時觸發
  
  const [loginError, setLoginError] = useState(false); // 登入錯誤處理
  const [shakeAccount, setShakeAccount] = useState(false); // Email 欄位錯誤特效
  const [shakePassword, setShakePassword] = useState(false); // Password 欄位錯誤特效
  const [submit, setSubmit] = useState(false); // 表單送出中的按鈕的效果
  const [showPassword, setShowPassword] = useState(false);
  
  // RHF有錯誤訊息時觸發晃動
  const onError = (errors: FieldErrors<LoginInput>) => {
    if (errors.account) {
      setShakeAccount(true);
      setTimeout(() => setShakeAccount(false), 400); // 0.4秒動畫跑完後，關掉開關
    }
    if (errors.password) {
      setShakePassword(true);
      setTimeout(() => setShakePassword(false), 400); // 0.4秒後關掉
    }
  };

  // 使用 RHF
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { account: "", password: "" },
  });

  const testA = () => {
    setValue("account", "hua870320@gmail.com", { shouldValidate: true });
    setValue("password", "qwe123", { shouldValidate: true });
  };

  const testB = () => {
    setValue("account", "111@gmail.com", { shouldValidate: true });
    setValue("password", "qwe123", { shouldValidate: true });
  };

  // 表單送出
  const onSubmit = async (data: LoginInput) => {
    if (submit) return; // 防止快速重複點擊

    setLoginError(false);
    setSubmit(true);

    const { account, password } = data;

    // 1. 第一時間立刻跳出「進行中」彈窗
    showAlert("loading", "登入中...", "請稍候...");

    try {
      // 💡 關鍵優化：讓後端 API 請求與「最少等待 1000ms」的承諾同時執行
      // Promise.all 會等待陣列裡的所有事情都做完，才繼續往下走
      const [onLogin] = await Promise.all([
        login(account, password), // 執行後端登入
        new Promise((resolve) => setTimeout(resolve, 1000)), // 強制最少定格 1 秒
      ]);

      // 走到這裡，代表至少過了 1 秒，且後端也回傳結果了，時間點被完美「統一」了！

      if (onLogin.success) {
        // 2. 成功狀態：切換為成功彈窗（不再需要再等 1 秒才切換）
        showAlert("success", "登入成功！", "即將為您跳轉至首頁...");

        // 成功彈窗維持 2 秒鐘，讓使用者看清楚綠色勾勾，然後自動跳轉
        setTimeout(() => {
          closeAlert();
          router.refresh();
          router.replace(nextPath);
        }, 2000);
      } else {
        showAlert("error", "登入失敗", "帳號或密碼輸入錯誤");

        setLoginError(true);
        setSubmit(false);
      }
    } catch {
      // 4. 意外錯誤狀態（例如斷網、伺服器掛掉）
      showAlert("error", "連線異常", "系統發生錯誤，請稍後再試。");
      setLoginError(true);
      setSubmit(false);
    }
  };

  return (
    <Container>
      <div className="bg-[#FCF9F6] flex justify-center items-center border-3 sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        {/* 廣告 */}
        <div className="w-0 h-0 lg:w-150 lg:h-180 flex justify-center items-center overflow-hidden">
          <Banner/>
        </div>

        <div className="w-110 h-screen sm:h-180 bg-[#FCF9F6] flex flex-col items-center">
          <h1 onClick={testA} className={`font-bold text-[26px] my-8`}>登入</h1>

          <form
            onSubmit={handleSubmit(onSubmit, onError)}
            className="flex flex-col items-center mb-4"
          >
            <div className="flex flex-col items-start mb-5">
              <label className="text-[20px] mb-2" htmlFor="email">
                電子郵件
              </label>
              <input
                {...register("account")}
                className={`${errors.account ? "border-red-500" : ""} ${shakeAccount ? "animate-shake" : ""} ${user_input} w-90 h-12 text-[16px] px-2 `}
                type="text"
                id="email"
                placeholder="請輸入電子郵件"
              />
              <div className="w-auto h-4">
                {errors.account && (
                  <p className={`text-red-500 text-sm mt-1 w-90 text-left`}>
                    {String(errors.account.message)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col items-start mb-4">
              <label className="text-[20px] mb-2" htmlFor="password">
                密碼
              </label>
              <div className="relative w-full">
                <input
                  {...register("password")}
                  className={`pr-10 ${errors.password ? "border-red-500" : ""} ${shakePassword ? "animate-shake" : ""} ${user_input} w-90 h-12 text-[16px] px-2 `}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="請輸入密碼"
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
            <div className="w-full h-10 flex justify-between mb-4">
              <div className="">
              </div>
              <Link
                className=" text-[16px] text-center h-6 align-middle w-28 text-blue-600 hover:bg-blue-100 active:bg-blue-800 active:text-white"
              href={`/user/forgetPassword`}
              >
                忘記密碼
              </Link>
            </div>

            <button
              onClick={() => {}}
              type="submit"
              disabled={submit}
              className={`-translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-55 h-15 ${submit ? `bg-gray-400 hover:bg-gray-400` : `bg-[#F02A2D] hover:bg-[#e50004]`}  text-white text-[26px] cursor-pointer  hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
            >
              {submit ? `登入中...` : `確認送出`}
            </button>
          </form>

          <h2 onClick={testB} className="text-[20px] my-8">--OR--</h2>
          <div className="flex justify-center items-center">
            <Link
              href={`http://localhost:3001/user/api/auth/google?next=${encodeURIComponent(nextPath)}`}
              className={`${button_shadow} w-40 h-15 mx-2 flex justify-center items-center -translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0`}
            >
              <Image
                className=" object-contain object-bottom w-10 mr-2"
                src={google}
                alt="廣告"
                width={30}
                height={30}
                priority
              />
              <span>google 登入</span>
            </Link>

            <Link
              className={`${button_shadow} w-40 h-15 mx-2 flex justify-center items-center -translate-x-0.5 -translate-y-0.5 hover:translate-x-0 hover:translate-y-0`}
              href={`/user/register`}
            >
              <RiLoginBoxLine className="text-4xl mr-2 " />
              按此註冊
            </Link>
          </div>
        </div>
      </div>
    </Container>
  );
}
