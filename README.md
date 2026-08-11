# 食刻 - Realicious

Realicious 結合了復古可愛的 Pixel 元素，導入美式且具雜誌感的視覺體驗。平台核心功能緊扣當代消費者的美食生活圈：透過美食文章與真實評論，多人線上聊天室，搭配多功能的美食商城，並將日常餐費記錄與小雞結合，增加使用者的趣味性。

---

## 專案簡介

* **開發背景**：本專案為 *4人團隊* 協作開發之前後端分離 Web 應用程式。
* **主要目的**：提供使用者瀏覽熱門餐廳、發表食記、在線討論交流、購買電子票券、記帳，並包含完整的會員權限管理系統。
  
[點此查看完整企劃書 (PDF)](Realicious.pdf)

---

## 系統功能畫面

### 1. 首頁

![首頁](./frontend/public/readme/realicious.gif)

### 2. 會員登入

![會員登入](./frontend/public/readme/user.gif)

### 3. 註冊

![註冊](./frontend/public/readme/register.gif)

### 4. 即時線上聊天室

![即時線上聊天室](./frontend/public/readme/chatroom.gif)

### 5. RWD 手機版

![RWD 手機版](./frontend/public/readme/RWD.gif)

---

## 前端

* **Framework**： Next.js ( App Router ) / React
* **Language**： TypeScript
* **Styling**： Tailwind CSS
* **Validation**： Zod ( 前端表單驗證 )

## 後端

* **Runtime**： Node.js
* **Framework**： Express.js
* **Database & ORM**： MySQL / Prisma ORM
* **Authentication**：  JWT / bcrypt
* **Module System**： ES Modules

## 開發工具與套件管理

* **Package Manager**： pnpm
* **Version Control**： Git / GitHub

---

## 團隊分配

我主要負責 **「 會員管理系統 」與「 多人線上聊天室 」** 的設計與實作：

1. **會員身分驗證與安全機制**：
   * 採用 **JWT 認證機制** 管理會員登入狀態與權限控管。
   * 使用 **bcrypt** 實現密碼雜湊加密，確保使用者憑證安全。

2. **即時聊天室**：
   * 使用 Web Socket 的技術做到即時訊息推播、頻道劃分、以及連線狀態管理 ( 採用 Socket.io 套件 )

3. **API 規劃與實作**：
   * 設計完整會員系統、聊天室 API 。
  
4. **資料庫 Schema 設計**：
   * 規劃會員及聊天室相關資料表結構，並確立與其他區塊（如文章/購物）的關聯。
  
5. **Prisma ORM**：
   * 使用 Prisma 來管理資料表，並建立測試假資料 seed。
  
6. **第三方登入**
   * 使用者可用 google 帳號進行登入
  
7. **自訂大頭貼**
   * 可選擇預設可愛小雞圖片或是自行上傳大頭貼
   * google 登入自動代入 google 帳號大頭貼

8. **響應式網頁設計**
   * 負責登入頁、註冊流程、會員中心、聊天室、側邊欄的設計

9. **email驗證**
   * 註冊或忘記密碼時，需驗證 email，使用 nodemailer 套件發送驗證信件

---

## 專案目錄結構

```bash
REALICIOUS/
├── backend/                       # 後端專案 (Node.js / Express / Prisma)
│   ├── prisma/                    # 資料庫 Schema 與 Migration 設定
│   ├── routes/user_api/           # 負責會員相關 API 路由設定
│   ├── middlewares/               # 身分驗證與權限判斷中間件
│   ├── sockets/                   # 負責Socket.io監聽事件
│   └── index.js                   # 後端伺服器進入點
│
├── frontend/                      # 前端專案 (Next.js / React / TypeScript / Tailwind)
│   ├── app/user/                  # Next.js App Router 頁面路由 (會員中心 + 聊天室)
│   └── validations/               # 前端表單驗證邏輯
│
├── .gitignore                     # 全域 Git 過濾檔
└── README.md                      # 專案說明文件
```

## 環境設定與本地端啟動

### 前置需求

* Node.js (v18+)
* MySQL (v8.0+)
* pnpm

### 1.複製專案

`git clone https://github.com/zxc020927150/Realicious.git`

`cd REALICIOUS`

### 2.設定環境變數 (.env)

* 請分別在 backend/ 與 frontend/ 目錄下，參考 .env.example 建立 .env 檔案

### 3.安裝後端套件

`cd backend`

`pnpm install`

### 4.資料庫初始化

* 開啟 MySQL CLI 或 GUI 工具，建立新資料庫

`CREATE DATABASE realicious CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

### 5.後端執行 Migration 與 新增假資料

* 執行資料庫 Migration

`npx prisma migrate dev`

* 導入測試用種子資料

`npx prisma db seed`

* 執行 generate

`npx prisma generate`

### 6.啟動後端開發伺服器

* 啟動後端伺服器 (http://localhost:3001)

`pnpm dev`

### 7.安裝前端套件

* 開啟新 Terminal

`cd frontend`

`pnpm install`

### 8.啟動前端伺服器

* 啟動前端伺服器 (http://localhost:3000)

`pnpm dev`

### 8.測試帳密

帳號：111@gmail.com

密碼：qwe123
