import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }) {
      // 세션에 사용자 ID 추가 (나중에 데이터베이스 연동 시 사용)
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
