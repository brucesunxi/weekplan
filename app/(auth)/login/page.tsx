"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("邮箱或密码错误");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="cute-card">
          <div className="text-center mb-6">
            <Link href="/" className="text-3xl">📋</Link>
            <h1 className="text-2xl font-black mt-2">欢迎回来</h1>
            <p className="text-sm text-muted-foreground mt-1">登录小计划，继续管理孩子的日程</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱"
                className="cute-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="cute-input"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
            )}

            <button type="submit" className="cute-button-primary w-full" disabled={loading}>
              {loading ? "登录中..." : "登录"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            还没有账号？{" "}
            <Link href="/register" className="text-primary-500 font-bold hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
