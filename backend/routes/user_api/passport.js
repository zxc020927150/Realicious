  import 'dotenv/config'
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from "../../lib/prisma.js";

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3001/user/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;
      const googleId = profile.id;
      
      // 💡 使用 Prisma 的 upsert 功能：
      // 如果用 google_id 或 email 找不到人，就建立一筆新資料 (INSERT)
      // 如果找到了，就更新（或者什麼都不做，直接返回該使用者資料）
      let user = await prisma.users.findUnique({
        where: { google_id: googleId }
      });

      if (!user) {
        // 如果用 google_id 找不到，改用 email 找（處理以前用密碼註冊，現在改用 Google 登入的老用戶）
        user = await prisma.users.findUnique({
          where: { account: email }
        });

        if (user) {
          // 老用戶：補綁定 google_id
          user = await prisma.users.update({
            where: { account: email },
            data: { google_id: googleId }
          });
        } else {
          // 新用戶：直接建立新帳號與 user_profile
          user = await prisma.users.create({
            data: {
              account: email,
              password: null, // Google 登入沒有密碼
              google_id: googleId,
              role: 11, // 預設權限
              status: 1,
              // 💡 順便連動建立 user_profile，把 Google 的大頭貼和名字存進去！
              user_profile: {
                create: {
                  nick_name: profile.displayName,
                  avatar: profile.photos?.[0]?.value || null
                }
              }
            }
          });
        }
      }

      // 成功撈出或建立 user 後，傳給下一個階段
      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));

// 序列化與反序列化（維持 Session 登入狀態）
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id },
      include: { user_profile: true } // 順便把個人檔案撈出來
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});


export default passport;