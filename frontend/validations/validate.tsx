import { z } from "zod";

// 定義登入的驗證規則
export const loginSchema = z.object({
  // 1. 驗證帳號必須是 Email 格式
  account: z
    .string()
    .min(1, { message: "此欄位必填" })
    .email({ message: "帳號必須是有效的 Email 格式" }),

  // 2. 驗證密碼必填
  password: z.string().min(1, { message: "此欄位必填" }),
});
export type LoginInput = z.infer<typeof loginSchema>;

// 定義註冊的驗證規則
export const registerSchema = z
  .object({
    // 1. 驗證帳號必須是 Email 格式
    account: z
      .string()
      .min(1, { message: "此欄位必填" })
      .email({ message: "帳號必須是有效的 Email 格式" }),

    // 2. 驗證碼必填6位數
    verification: z.string().min(1, { message: "此欄位必填" }),

    // 3. 驗證密碼至少 6 位元，且透過正規表達式確保含英文與數字，可包含特殊字元
    password: z
      .string()
      .min(6, { message: "密碼至少需要 6 個字元" })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/, {
        message: "密碼必須包含至少一個英文與一個數字（可包含特殊字元）",
      }),
    check: z.string().min(1, { message: "此欄位必填" }),
  })
  .refine((data) => data.password === data.check, {
    message: "密碼驗證不相同",
    path: ["check"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// 定義登入的驗證規則
export const personalSchema = z.object({
  avatar: z.string().min(1, { message: "此欄位必填" }),
  first_name: z.string().min(1, { message: "此欄位必填" }),
  last_name: z.string().min(1, { message: "此欄位必填" }),
  nick_name: z.string().min(1, { message: "此欄位必填" }),
  city: z.string().min(1, { message: "此欄位必填" }),
  district: z.string().min(1, { message: "此欄位必填" }),
  address: z.string().min(1, { message: "此欄位必填" }),
  phone: z.number().min(1, { message: "此欄位必填" }),
  birthday: z.string().min(1, { message: "此欄位必填" }),
});
export type PersonalInput = z.infer<typeof personalSchema>;

// 定義登入的驗證規則
export const forgetPasswordSchema = z.object({
  // 1. 驗證帳號必須是 Email 格式
  email: z
    .string()
    .min(1, { message: "此欄位必填" })
    .email({ message: "帳號必須是有效的 Email 格式" }),

  // 2. 驗證密碼必填
  code: z.string().min(1, { message: "此欄位必填" }),
});
export type forgetPasswordInput = z.infer<typeof forgetPasswordSchema>;

// 定義註冊的驗證規則
export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, { message: "密碼至少需要 6 個字元" })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/, {
        message: "密碼必須包含至少一個英文與一個數字（可包含特殊字元）",
      }),
    check: z.string().min(1, { message: "此欄位必填" }),
  })
  .refine((data) => data.password === data.check, {
    message: "密碼驗證不相同",
    path: ["check"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;