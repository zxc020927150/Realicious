import { z } from 'zod';

// 定義登入的驗證規則
export const loginSchema = z.object({
  // 1. 驗證帳號必須是 Email 格式
  account: z
    .string()
    .min(1, { message: "帳號為必填項" })
    .email({ message: "帳號必須是有效的 Email 格式" }),

  // 2. 驗證密碼至少 6 位元，且透過正規表達式確保含英文與數字，可包含特殊字元
  password: z
    .string()
    .min(6, { message: "密碼至少需要 6 個字元" })
    .regex(/^(?=.*[A-Za-z])(?=.*\d).{6,}$/, {
      message: "密碼必須包含至少一個英文與一個數字（可包含特殊字元）",
    }),
});

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
  .refine((data) => data.password === data.check, { message: "密碼驗證不相同",path:['check'], });

// 泛用驗證中介軟體（保持不變）
export const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  
  if (!result.success) {
    const errorMessages = result.error.errors.map(err => ({
      field: err.path[0],
      message: err.message
    }));
    
    return res.status(400).json({ 
      success: false, 
      message: "欄位驗證失敗", 
      errors: errorMessages 
    });
  }
  
  req.body = result.data;
  next();
};