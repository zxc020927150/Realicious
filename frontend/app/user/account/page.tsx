"use client";

import "./account.css";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/app/context/user";
import Cookies from "js-cookie";
import { cities, districts } from "use-tw-zipcode";

import { useAlert } from "../context/alert";
import Container from "../_components/container";
import Left from "./_components/left";
import PageHeader from "@/app/_components/PageHeader";
import AvatarUploader from "./_components/avatarUploader";
import {
  button_revise,
  button_cancel,
  button_submit,
  user_input,
} from "../_components/button";

import { FaUser } from "react-icons/fa";

interface FullProfile {
  avatar: string;
  first_name: string;
  last_name: string;
  nick_name: string;
  city: string | null;
  district: string | null;
  address: string;
  phone: string | undefined;
  birthday: string;
}

const defaultValues: FullProfile = {
  avatar: "",
  first_name: "",
  last_name: "",
  nick_name: "",
  city: null,
  district: null,
  address: "",
  phone: undefined,
  birthday: "",
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/user/api`;

export default function ProfileForm() {
  const { user, setUser } = useUser();
  const { showAlert, closeAlert } = useAlert();
  const router = useRouter();

  // 控制是否為編輯模式
  const [isEditing, setIsEditing] = useState(false);
  // 畫面上正在輸入的資料
  const [formData, setFormData] = useState<FullProfile>(defaultValues);
  // 備份後端抓回來的原始資料，取消時使用
  const [originalData, setOriginalData] = useState<FullProfile>(defaultValues);
  // 載入狀態
  const [loading, setLoading] = useState(true);

  // 進入頁面時，Fetch 會員資料
  useEffect(() => {
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
          const profileData = result.data;
          setFormData(profileData);
          setOriginalData(profileData);
        }
      } catch (error) {
        showAlert("error", "伺服器異常");
        console.error("抓取詳細資料失敗:", error);
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchFullProfile();
  }, []);

  // 處理一般 Input 改變
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
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

  // 取消鍵：還原原始資料
  const handleCancel = () => {
    setFormData(originalData);
    setIsEditing(false);
  };

  // 送出鍵：更新 API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (res.ok && result.success) {
        showAlert("success", "資料更新成功！");
        setOriginalData(formData);
        setIsEditing(false);
        setTimeout(() => {
          closeAlert();
        }, 2000);
      } else {
        showAlert("error", "更新失敗！", result.message);
      }
    } catch (error) {
      console.error("發送更新 API 失敗:", error);
      showAlert("error", "系統發生錯誤，請稍後再試");
    }
  };

  if (loading) return <div className="p-6">詳細資料載入中...</div>;

  // 取得當前縣市對應的鄉鎮區清單 (沒有選擇縣市或選回預設值時為空陣列)
  const availableDistricts = formData.city
    ? districts[formData.city] || []
    : [];

  return (
    <Container className="bg-white flex-col h-dvh sm:h-full sm:flex-row overflow-hidden">
      
      <Left></Left>
      <div className="w-full sm:w-[70%] h-180 p-4 overflow-y-auto no-scrollbar">
        <div className="relative flex justify-between">
          <div>
            <PageHeader
              icon={<FaUser className="h-5 w-5" />}
              title="個人資料"
            />
          </div>
          <AvatarUploader
            currentAvatar={formData.avatar}
            onUploadSuccess={(newUrl) => {
              // 1. 更新表單與備份狀態
              setFormData((prev) => ({ ...prev, avatar: newUrl }));
              setOriginalData((prev) => ({ ...prev, avatar: newUrl }));

              // 2. 安全地更新 全域 UserContext & Cookie
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between items-center">
            {/* 姓氏欄位 */}
            <div className="w-[49%]">
              <label className="block text-sm font-medium text-gray-700">
                姓氏
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`${user_input} mt-1 block w-full shadow-sm p-2 disabled:bg-gray-100 disabled:border-0`}
              />
            </div>
            {/* 姓名欄位 */}
            <div className="w-[49%]">
              <label className="block text-sm font-medium text-gray-700">
                姓名
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name || ""}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`${user_input} mt-1 block w-full shadow-sm p-2 disabled:bg-gray-100 disabled:border-0`}
              />
            </div>
          </div>

          {/* 暱稱欄位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              暱稱
            </label>
            <input
              type="text"
              name="nick_name"
              value={formData.nick_name || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`${user_input} mt-1 block w-full shadow-sm p-2 disabled:bg-gray-100 disabled:border-0`}
            />
          </div>

          <div className="flex justify-between items-center">
            {/* 縣市欄位 */}
            <div className="w-[49%]">
              <label className="block text-sm font-medium text-gray-700">
                縣市
              </label>
              <select
                name="city"
                value={formData.city || ""}
                onChange={onCitySelectChange}
                disabled={!isEditing}
                className={`${user_input} mt-1 block w-full shadow-sm p-2 disabled:bg-gray-100 disabled:border-0`}
              >
                <option value="">請選擇縣市</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* 鄉鎮欄位 */}
            <div className="w-[49%]">
              <label className="block text-sm font-medium text-gray-700">
                鄉鎮
              </label>
              <select
                name="district"
                value={formData.district || ""}
                onChange={onDistrictSelectChange}
                // 未開啟編輯模式，或是未選擇縣市時禁用
                disabled={!isEditing || !formData.city}
                className={`${user_input} mt-1 block w-full shadow-sm p-2 disabled:bg-gray-100 disabled:border-0`}
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

          {/* 詳細地址欄位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              詳細地址
            </label>
            <input
              type="text"
              name="address"
              value={formData.address || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`${user_input} mt-1 block w-full shadow-sm p-2 disabled:bg-gray-100 disabled:border-0`}
            />
          </div>

          {/* 電話欄位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              電話
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`${user_input} mt-1 block w-full shadow-sm p-2 disabled:bg-gray-100 disabled:border-0`}
            />
          </div>

          {/* 生日欄位 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              生日
            </label>
            <input
              type="date"
              name="birthday"
              value={formData.birthday || ""}
              onChange={handleInputChange}
              disabled={!isEditing}
              className={`${user_input} mt-1 block w-full shadow-sm p-2 disabled:bg-gray-100 disabled:border-0`}
            />
          </div>

          {/* 按鈕邏輯 */}
          <div className="flex justify-start space-x-2 pt-4">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className={`${button_revise}`}
              >
                修改資料
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={`${button_cancel} mr-8`}
                >
                  取消
                </button>
                <button type="submit" className={`${button_submit}`}>
                  確認送出
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </Container>
  );
}
