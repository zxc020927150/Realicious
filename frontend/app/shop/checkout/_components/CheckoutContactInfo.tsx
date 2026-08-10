"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Cookies from "js-cookie";
import { Check, Pencil } from "lucide-react";
import { cities, districts } from "use-tw-zipcode";
import {
  formatOrderAddress,
  normalizeTaiwanMobile,
  type OrderContact,
  validateOrderContact,
} from "@/lib/shop/orders";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = `${BASE_URL}/user/api`;

const CONTACT_FIELDS: (keyof OrderContact)[] = [
  "name",
  "email",
  "phone",
  "city",
  "district",
  "address",
];

const ALL_FIELDS_TOUCHED = CONTACT_FIELDS.reduce<
  Partial<Record<keyof OrderContact, boolean>>
>((result, field) => {
  result[field] = true;
  return result;
}, {});

interface FullProfile {
  first_name?: string;
  last_name?: string;
  nick_name?: string;
  account?: string;
  email?: string;
  city?: string | null;
  district?: string | null;
  address?: string;
  phone?: string;
}

function normalizeProfileCity(value?: string | null) {
  const normalizedCity = (value || "").trim().replaceAll("臺", "台");
  return cities.includes(normalizedCity) ? normalizedCity : "";
}

function normalizeProfileDistrict(city: string, value?: string | null) {
  const normalizedDistrict = (value || "").trim().replaceAll("臺", "台");
  return (districts[city] || []).includes(normalizedDistrict)
    ? normalizedDistrict
    : "";
}

function fillBlankFieldsFromProfile(
  contact: OrderContact,
  profileContact: OrderContact,
) {
  const nextContact = { ...contact };

  (["name", "email", "phone", "address"] as const).forEach((field) => {
    if (!nextContact[field].trim() && profileContact[field].trim()) {
      nextContact[field] = profileContact[field];
    }
  });

  if (!nextContact.city.trim() && profileContact.city.trim()) {
    nextContact.city = profileContact.city;
    nextContact.district = profileContact.district;
  } else if (
    !nextContact.district.trim()
    && nextContact.city === profileContact.city
    && profileContact.district.trim()
  ) {
    nextContact.district = profileContact.district;
  }

  return nextContact;
}

export default function CheckoutContactInfo({
  defaultEmail = "",
  onContactChange,
  onEditingChange,
  validationRequest = 0,
}: {
  defaultEmail?: string;
  onContactChange?: (contact: OrderContact) => void;
  onEditingChange?: (isEditing: boolean) => void;
  validationRequest?: number;
}) {
  const initialContact: OrderContact = {
    name: "",
    email: defaultEmail,
    phone: "",
    city: "",
    district: "",
    address: "",
  };
  const [contact, setContact] = useState<OrderContact>(initialContact);
  const [profileContact, setProfileContact] = useState<OrderContact>(initialContact);
  const [touched, setTouched] = useState<
    Partial<Record<keyof OrderContact, boolean>>
  >({});
  const [isEditing, setIsEditing] = useState(false);
  const isEdited = useRef(false);
  const errors = useMemo(() => validateOrderContact(contact), [contact]);
  const hasErrors = Object.keys(errors).length > 0;
  const displayEditing = isEditing || (validationRequest > 0 && hasErrors);
  const availableDistricts = contact.city
    ? districts[contact.city] || []
    : [];

  useEffect(() => {
    onContactChange?.(contact);
  }, [contact, onContactChange]);

  useEffect(() => {
    onEditingChange?.(isEditing);
  }, [isEditing, onEditingChange]);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = Cookies.get("token");
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/profile/full`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        if (!res.ok || !result.success) return;

        const profile = result.data as FullProfile;
        const profileName = `${profile.last_name || ""}${profile.first_name || ""}`.trim()
          || profile.nick_name
          || "";
        const profileCity = normalizeProfileCity(profile.city);
        const profileDistrict = normalizeProfileDistrict(
          profileCity,
          profile.district,
        );
        const nextProfileContact: OrderContact = {
          name: profileName,
          email: profile.email || profile.account || defaultEmail,
          phone: normalizeTaiwanMobile(profile.phone || "")
            .replace(/\D/g, "")
            .slice(0, 10),
          city: profileCity,
          district: profileDistrict,
          address: profile.address || "",
        };

        setProfileContact(nextProfileContact);
        if (!isEdited.current) setContact(nextProfileContact);
      } catch (error) {
        console.error("讀取結帳聯絡資料失敗:", error);
      }
    };

    fetchProfile();
  }, [defaultEmail]);

  const handleChange = (field: keyof OrderContact, value: string) => {
    isEdited.current = true;
    setIsEditing(true);
    setContact((currentContact) => ({
      ...currentContact,
      [field]: value,
    }));
  };

  const handlePhoneChange = (value: string) => {
    handleChange("phone", value.replace(/\D/g, "").slice(0, 10));
  };

  const handleCityChange = (value: string) => {
    isEdited.current = true;
    setIsEditing(true);
    const nextCity = value || profileContact.city;
    const nextDistrict = nextCity === profileContact.city
      ? profileContact.district
      : "";

    setContact((currentContact) => ({
      ...currentContact,
      city: nextCity,
      district: nextDistrict,
    }));
    setTouched((currentTouched) => ({
      ...currentTouched,
      city: true,
      district: false,
    }));
  };

  const handleDistrictChange = (value: string) => {
    const fallbackDistrict = contact.city === profileContact.city
      ? profileContact.district
      : "";
    handleChange("district", value || fallbackDistrict);
    setTouched((currentTouched) => ({
      ...currentTouched,
      district: true,
    }));
  };

  const handleBlur = (field: keyof OrderContact) => {
    setTouched((currentTouched) => ({ ...currentTouched, [field]: true }));
    if (contact[field].trim()) return;

    if (field === "district" && contact.city !== profileContact.city) return;

    const fallbackValue = profileContact[field].trim();
    if (fallbackValue) {
      setContact((currentContact) => ({
        ...currentContact,
        [field]: fallbackValue,
      }));
    }
  };

  const handleComplete = () => {
    const nextContact = fillBlankFieldsFromProfile(contact, profileContact);
    setContact(nextContact);
    setTouched(ALL_FIELDS_TOUCHED);

    if (Object.keys(validateOrderContact(nextContact)).length === 0) {
      setIsEditing(false);
    }
  };

  const getPlaceholder = (field: keyof OrderContact, label: string) => {
    const fallbackValue = profileContact[field].trim();
    return fallbackValue
      ? `留空將使用會員資料：${fallbackValue}`
      : `請輸入${label}`;
  };

  const showError = (field: keyof OrderContact) => Boolean(
    (touched[field] || validationRequest > 0) && errors[field],
  );
  const inputClassName = (field: keyof OrderContact) => (
    `mt-1 w-full border-2 bg-[#FFFDF7] px-3 py-2 text-sm font-normal text-[#3D2419] shadow-[2px_2px_0px_0px_#3D2419] outline-none transition placeholder:text-gray-400 focus:bg-[#FFF8D9] focus:ring-2 focus:ring-[#FBDF58] ${
      showError(field)
        ? "border-[#BB0015] shadow-[2px_2px_0px_0px_#BB0015]"
        : "border-[#3D2419]"
    }`
  );
  const selectClassName = (field: keyof OrderContact) => (
    `${inputClassName(field)} cursor-pointer appearance-none pr-10 font-bold disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-[#3D2419]/45 disabled:shadow-none`
  );

  return (
    <div id="checkout-contact-info" className="w-full scroll-mt-24">
      <div className="flex w-full flex-col border-[3px] border-[#3D2419] bg-[#FCF9F6] px-4 py-2.5 text-base font-bold text-[#3D2419] shadow-[4px_4px_0px_0px_#3D2419]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl">聯絡資訊</h2>
          <button
            type="button"
            onClick={() => {
              if (displayEditing) handleComplete();
              else setIsEditing(true);
            }}
            className="flex items-center gap-1.5 border-2 border-[#3D2419] bg-white px-3 py-1.5 text-sm shadow-[2px_2px_0px_0px_#3D2419] transition-all hover:bg-[#FBDF58] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            aria-label={displayEditing ? "完成修改聯絡資訊" : "修改聯絡資訊"}
          >
            {displayEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            <span>{displayEditing ? "完成" : "修改"}</span>
          </button>
        </div>

        {Object.keys(errors).length > 0 && validationRequest > 0 && (
          <div
            role="alert"
            className="mb-3 border-2 border-[#BB0015] bg-red-50 px-3 py-2 text-sm font-bold text-[#BB0015]"
          >
            請確認紅色標示的聯絡資料後再結帳。
          </div>
        )}

        {displayEditing ? (
          <div className="flex flex-col gap-3">
            <label htmlFor="checkout-contact-name">
              <span className="text-sm">姓名 <span className="text-[#BB0015]">*</span></span>
              <input
                id="checkout-contact-name"
                type="text"
                autoComplete="name"
                maxLength={50}
                required
                placeholder={getPlaceholder("name", "姓名")}
                value={contact.name}
                onChange={(event) => handleChange("name", event.target.value)}
                onBlur={() => handleBlur("name")}
                aria-invalid={showError("name")}
                aria-describedby="checkout-contact-name-error checkout-contact-name-hint"
                className={inputClassName("name")}
              />
              {showError("name") ? (
                <p id="checkout-contact-name-error" className="mt-1 text-xs font-bold text-[#BB0015]">{errors.name}</p>
              ) : (
                <p id="checkout-contact-name-hint" className="mt-1 text-xs font-normal text-[#3D2419]/55">2–50 個字元，可填寫中文或外文姓名</p>
              )}
            </label>

            <label htmlFor="checkout-contact-email">
              <span className="text-sm">電子郵件 <span className="text-[#BB0015]">*</span></span>
              <input
                id="checkout-contact-email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                placeholder={getPlaceholder("email", "電子郵件")}
                value={contact.email}
                onChange={(event) => handleChange("email", event.target.value)}
                onBlur={() => handleBlur("email")}
                aria-invalid={showError("email")}
                aria-describedby="checkout-contact-email-error"
                className={inputClassName("email")}
              />
              {showError("email") && (
                <p id="checkout-contact-email-error" className="mt-1 text-xs font-bold text-[#BB0015]">{errors.email}</p>
              )}
            </label>

            <label htmlFor="checkout-contact-phone">
              <span className="text-sm">手機號碼 <span className="text-[#BB0015]">*</span></span>
              <input
                id="checkout-contact-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                pattern="[0-9]*"
                required
                placeholder={getPlaceholder("phone", "手機號碼")}
                value={contact.phone}
                onChange={(event) => handlePhoneChange(event.target.value)}
                onBlur={() => handleBlur("phone")}
                aria-invalid={showError("phone")}
                aria-describedby={showError("phone") ? "checkout-contact-phone-error" : undefined}
                className={inputClassName("phone")}
              />
              {showError("phone") && (
                <p id="checkout-contact-phone-error" className="mt-1 text-xs font-bold text-[#BB0015]">{errors.phone}</p>
              )}
            </label>

            <fieldset>
              <legend className="text-sm">地址 <span className="text-[#BB0015]">*</span></legend>
              <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label htmlFor="checkout-contact-city" className="text-xs font-normal">
                  縣市
                  <div className="relative">
                    <select
                      id="checkout-contact-city"
                      autoComplete="address-level1"
                      required
                      value={contact.city}
                      onChange={(event) => handleCityChange(event.target.value)}
                      onBlur={() => handleBlur("city")}
                      aria-invalid={showError("city")}
                      className={selectClassName("city")}
                    >
                      <option value="">請選擇縣市</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 mt-1 flex items-center text-xs" aria-hidden="true">
                      ▼
                    </span>
                  </div>
                  {showError("city") && (
                    <p className="mt-1 text-xs font-bold text-[#BB0015]">{errors.city}</p>
                  )}
                </label>

                <label htmlFor="checkout-contact-district" className="text-xs font-normal">
                  鄉鎮區
                  <div className="relative">
                    <select
                      id="checkout-contact-district"
                      autoComplete="address-level2"
                      required
                      disabled={!contact.city}
                      value={contact.district}
                      onChange={(event) => handleDistrictChange(event.target.value)}
                      onBlur={() => handleBlur("district")}
                      aria-invalid={showError("district")}
                      className={selectClassName("district")}
                    >
                      <option value="">請選擇鄉鎮區</option>
                      {availableDistricts.map((district) => (
                        <option key={district} value={district}>{district}</option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 mt-1 flex items-center text-xs" aria-hidden="true">
                      ▼
                    </span>
                  </div>
                  {showError("district") && (
                    <p className="mt-1 text-xs font-bold text-[#BB0015]">{errors.district}</p>
                  )}
                </label>
              </div>
            </fieldset>

            <label htmlFor="checkout-contact-address">
              <span className="text-sm">詳細地址 <span className="text-[#BB0015]">*</span></span>
              <input
                id="checkout-contact-address"
                type="text"
                autoComplete="street-address"
                maxLength={100}
                required
                placeholder={getPlaceholder("address", "路名、段、巷、弄、號、樓")}
                value={contact.address}
                onChange={(event) => handleChange("address", event.target.value)}
                onBlur={() => handleBlur("address")}
                aria-invalid={showError("address")}
                aria-describedby={showError("address")
                  ? "checkout-contact-address-error"
                  : "checkout-contact-address-hint"}
                className={inputClassName("address")}
              />
              {showError("address") ? (
                <p id="checkout-contact-address-error" className="mt-1 text-xs font-bold text-[#BB0015]">{errors.address}</p>
              ) : (
                <p id="checkout-contact-address-hint" className="mt-1 text-xs font-normal text-[#3D2419]/55">
                  請填寫路名、巷弄、門牌或樓層，至少 5 個字元
                </p>
              )}
            </label>
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="mb-1 text-[#3D2419]/60">姓名</dt>
              <dd className="min-h-5 break-words">{contact.name || "尚未填寫"}</dd>
            </div>
            <div>
              <dt className="mb-1 text-[#3D2419]/60">電子郵件</dt>
              <dd className="min-h-5 break-all">{contact.email || "尚未填寫"}</dd>
            </div>
            <div>
              <dt className="mb-1 text-[#3D2419]/60">手機號碼</dt>
              <dd className="min-h-5 break-words">{contact.phone || "尚未填寫"}</dd>
            </div>
            <div>
              <dt className="mb-1 text-[#3D2419]/60">地址</dt>
              <dd className="min-h-5 break-words">{formatOrderAddress(contact) || "尚未填寫"}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
