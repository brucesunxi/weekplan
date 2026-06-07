import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "./crypto";

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
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { Redis } = await import("@upstash/redis");
        const kv = new Redis({
          url: process.env.KV_REST_API_URL || "",
          token: process.env.KV_REST_API_TOKEN || "",
        });

        const email = credentials.email as string;
        const password = credentials.password as string;

        const userData = await kv.hgetall(`user:email:${email}`) as Record<string, string> | null;
        if (!userData) return null;

        const valid = await compare(password, userData.password);
        if (!valid) return null;

        return { id: userData.id, name: userData.name, email: userData.email };
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
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
