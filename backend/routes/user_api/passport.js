import 'dotenv/config';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { prisma } from "../../lib/prisma.js";

const clientID = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (clientID && clientSecret) {
  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:3001/user/api/auth/google/callback"
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;
          const googleId = profile.id;

          let user = await prisma.users.findUnique({
            where: { google_id: googleId }
          });

          if (!user) {
            user = await prisma.users.findUnique({
              where: { account: email }
            });

            if (user) {
              user = await prisma.users.update({
                where: { account: email },
                data: { google_id: googleId }
              });
            } else {
              user = await prisma.users.create({
                data: {
                  account: email,
                  password: null,
                  google_id: googleId,
                  role: 11,
                  status: 1,
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

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
} else {
  console.warn("[Passport Warning] 未設定 GOOGLE_CLIENT_ID 或 GOOGLE_CLIENT_SECRET，Google 第三方登入功能已暫停使用。");
}

// 序列化與反序列化（維持 Session 登入狀態）
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id },
      include: { user_profile: true }
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;