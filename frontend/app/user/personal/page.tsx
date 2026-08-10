"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/app/context/user";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { cities, districts } from "use-tw-zipcode";

import Container from "../_components/container";
import AvatarUploader from "../account/_components/avatarUploader";
import { useAlert } from "../context/alert";
import { button_revise, button_submit ,user_input} from "../_components/button";

interface FullProfile {
  avatar: string;
  first_name: string;
  last_name: string;
  nick_name: string;
  city: string;
  district: string;
  address: string;
  phone: string | undefined;
  birthday: string;
}

const defaultValues: FullProfile = {
  avatar: "",
  first_name: "",
  last_name: "",
  nick_name: "",
  city: "",
  district: "",
  address: "",
  phone: undefined,
  birthday: "",
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/user/api`;

export default function OnboardingForm() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const { showAlert, closeAlert } = useAlert();

  // 🌟 控制目前步驟：1 代表第一頁（歡迎/基本資料），2 代表第二頁（聯絡與其他資料）
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<FullProfile>(defaultValues);
  const [loading, setLoading] = useState(true);

  // 進入頁面時，先撈取目前的資料（可能已經有信箱等基本預設值）
  useEffect(() => {
    router.refresh();
    const fetchFullProfile = async () => {
      const token = Cookies.get("token");
      try {
        const res = await fetch(`${API_URL}/profile/full`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await res.json();

        if (res.ok && result.success) {
          setFormData(result.data);
        } else {
          showAlert("error", "連線異常", result.message);
          setTimeout(() => {
            router.refresh();
            router.replace("/");
            return;
          }, 2000);
        }
      } catch (error) {
        console.error("抓取詳細資料失敗:", error);
        showAlert("error", "連線異常", "系統發生錯誤，請稍後再試。");
        setTimeout(() => {
          router.refresh();
          router.replace("/");
          return;
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchFullProfile();
  }, [router, showAlert]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // 專門處理「縣市」變更
  const onCitySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const newCity = selectedValue === "" ? "" : selectedValue;
    setFormData((prev) => ({
      ...prev,
      city: newCity,
      district: "", // 切換或重置縣市時，鄉鎮區強制設為""，null後端會有問題
    }));
  };

  // 專門處理「鄉鎮區」變更
  const onDistrictSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const newDistrict = selectedValue === "" ? "" : selectedValue;
    setFormData((prev) => ({
      ...prev,
      district: newDistrict,
    }));
  };
  // 取得當前縣市對應的鄉鎮區清單 (沒有選擇縣市或選回預設值時為空陣列)
  const availableDistricts = formData.city
    ? districts[formData.city] || []
    : [];

  // 🌟 統一處理後端 API 送出的邏輯
  const saveProfileData = async () => {
    const token = Cookies.get("token");
    try {
      const res = await fetch(`${API_URL}/profile/full`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      return {
        success: res.ok && result.success,
        message: result.message,
        user: result.user,
      };
    } catch (error) {
      console.error("發送更新 API 失敗:", error);
      return { success: false, message: "系統發生錯誤" };
    }
  };
  // 跳過處理：直接去下一頁，或是直接去首頁
  const handleSkip = (target: "step2" | "home") => {
    if (target === "step2") {
      setStep(2);
    } else {
      router.push("/");
    }
  };

  // 第一步送出：儲存並進到第二步
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveProfileData();
    if (result.success) {
      // 🌟 修正點：保留舊有 user 資訊（如 id, email），並融入後端回傳的新資料
      setUser((prev) => {
        const updatedUser = { ...prev, ...result.user };
        // 🌟 順便同步把新狀態寫進本地 Cookie，防止重新整理或換頁時掉狀態
        Cookies.set("user", JSON.stringify(updatedUser), { expires: 1 });
        return updatedUser;
      });

      setStep(2); // 進到第二頁
    } else {
      showAlert("error", "儲存失敗", result.message);
    }
  };

  // 第二步送出：儲存並回到首頁
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await saveProfileData();
    if (result.success) {
      // 🌟 修正點：同上，保留舊有資訊並融入新資料、同步 Cookie
      setUser((prev) => {
        const updatedUser = { ...prev, ...result.user };
        Cookies.set("user", JSON.stringify(updatedUser), { expires: 1 });
        return updatedUser;
      });
      showAlert("success", "太棒了", "恭喜完成會員設定！");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } else {
      showAlert("error", "儲存失敗", result.message);
    }
  };
  const testA = ()=>{
    setFormData({
  avatar: "",
  first_name: "呈華",
  last_name: "許",
  nick_name: "阿華",
  city: "台北市",
  district: "大安區",
  address: "復興南路一段390號2樓",
  phone: "0912345678",
  birthday: "1990/01/01",
});
  }

  if (loading)
    return <div className="p-6 text-center">正在準備您的專屬迎新頁面...</div>;

  return (
    // 移除 Left 組件，改用乾淨的置中卡片設計，專注於引導填寫
    <Container className=" justify-center items-center py-10">
      <div className="w-full max-w-lg p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-[#FCF9F6]">
        {/* 步驟進度條提示 */}
        <div className="flex justify-between items-center mb-6 text-xs text-gray-400">
          <span className={`${step === 1 ? " text-[#BB0015] font-bold" : ""}`}>
            1. 基本資料
          </span>
          <div className="flex-1 h-0.5 bg-gray-200 mx-4">
            <div
              className={`h-full bg-[#BB0015] transition-all duration-300 ${step === 2 ? "w-full" : "w-0"}`}
            ></div>
          </div>
          <span className={`${step === 2 ? "text-[#BB0015] font-bold" : ""}`}>
            2. 詳細資訊
          </span>
        </div>

        {/* ==================== 第一頁：歡迎與基本檔案 ==================== */}
        {step === 1 && (
          <div>
            <div className="text-center mb-6">
              <h2 onClick={testA} className="text-2xl font-bold text-gray-800">歡迎加入</h2>
              <p className="text-sm text-gray-500 mt-1">
                讓我們簡單認識一下你，設定個漂亮的檔案吧！
              </p>
            </div>

            {/* 大頭貼 */}
            <div className="flex justify-center mb-6">
              <AvatarUploader
                currentAvatar={formData.avatar}
                onUploadSuccess={(newUrl) => {
                  setFormData((prev) => ({ ...prev, avatar: newUrl }));
                  setUser((prev) => {
                if (!prev) return null;
                const updatedUser = { ...prev, avatar: newUrl };
                Cookies.set("user", JSON.stringify(updatedUser), {
                  expires: 1,
                });
                return updatedUser;
              });
                }}
              />
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    姓氏
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="例如：陳"
                    className={`placeholder-gray-400 mt-1 block w-full border-gray-300 shadow-sm p-2 bg-gray-50 focus:bg-white`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    名字
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="例如：小明"
                    className="placeholder-gray-400 mt-1 block w-full  border-gray-300 shadow-sm p-2 bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  暱稱
                </label>
                <input
                  type="text"
                  name="nick_name"
                  value={formData.nick_name}
                  onChange={handleInputChange}
                  placeholder="想被怎麼稱呼呢？"
                  className="placeholder-gray-400 mt-1 block w-full  border-gray-300 shadow-sm p-2 bg-gray-50 focus:bg-white"
                />
              </div>

              {/* 按鈕區 */}
              <div className="flex justify-between items-center pt-6">
                <button
                  type="button"
                  onClick={() => handleSkip("step2")}
                  className="cursor-pointer text-sm text-gray-400 hover:text-gray-600 transition"
                >
                  跳過，填下一步
                </button>
                <button type="submit" className={`${button_revise}`}>
                  下一步
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== 第二頁：詳細聯絡資訊 ==================== */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800">完善聯絡資料</h2>
              <p className="text-sm text-gray-500 mt-1">
                填寫完成後即可享受網站的所有完整功能。
              </p>
            </div>

            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    縣市
                  </label>
                  <select
                    name="city"
                    value={formData.city || ""}
                    onChange={onCitySelectChange}
                    className="cursor-pointer placeholder-gray-400 mt-1 block w-full border-gray-300 shadow-sm p-2 bg-gray-50 focus:bg-white"
                  >
                    <option value="">請選擇縣市</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    鄉鎮
                  </label>
                  <select
                    name="district"
                    value={formData.district || ""}
                    onChange={onDistrictSelectChange}
                    disabled={!formData.city}
                    className="cursor-pointer placeholder-gray-400 mt-1 block w-full border-gray-300 shadow-sm p-2 bg-gray-50 focus:bg-white"
                  >
                    <option value="">請選擇鄉鎮區</option>
                    {availableDistricts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  詳細地址
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="信義路五段 X 號"
                  className="placeholder-gray-400 mt-1 block w-full border-gray-300 shadow-sm p-2 bg-gray-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  電話
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleInputChange}
                  placeholder="0912345678"
                  className="placeholder-gray-400 mt-1 block w-full border-gray-300 shadow-sm p-2 bg-gray-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  生日
                </label>
                <input
                  type="date"
                  name="birthday"
                  value={formData.birthday}
                  onChange={handleInputChange}
                  className=" mt-1 block w-full border-gray-300 shadow-sm p-2 bg-gray-50 focus:bg-white"
                />
              </div>

              {/* 按鈕區 */}
              <div className="flex justify-between items-center pt-6">
                <button
                  type="button"
                  onClick={() => setStep(1)} // 允許走回上一步，體驗更好
                  className=" cursor-pointer text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  返回上一步
                </button>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => handleSkip("home")}
                    className="cursor-pointer text-sm text-gray-400 hover:text-gray-600 transition"
                  >
                    跳過，進入首頁
                  </button>
                  <button type="submit" className={`${button_submit}`}>
                    完成填寫
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </Container>
  );
}
