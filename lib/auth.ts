import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "./crypto";

declare module "next-auth" {
  interface User {
    id: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "用户名", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const { Redis } = await import("@upstash/redis");
        const kv = new Redis({
          url: process.env.KV_REST_API_URL || "",
          token: process.env.KV_REST_API_TOKEN || "",
        });

        const username = credentials.username as string;
        const password = credentials.password as string;

        const userData = await kv.hgetall(`user:${username}`) as Record<string, string> | null;
        if (!userData) return null;

        const valid = await compare(password, userData.password);
        if (!valid) return null;

        return { id: userData.id, name: username, email: "" };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      if (user) token.name = user.name;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
});
