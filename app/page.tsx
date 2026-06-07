"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/children");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="text-4xl"
        >
          🌟
        </motion.div>
      </div>
    );
  }

  if (status === "authenticated") return null;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <header className="flex items-center justify-between px-6 py-4 max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📋</span>
          <span className="text-xl font-bold">小计划</span>
        </div>
        <div className="flex gap-2">
          <Link href="/login" className="cute-button-secondary text-sm px-4 py-2">
            登录
          </Link>
          <Link href="/register" className="cute-button-primary text-sm px-4 py-2">
            注册
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 pt-16 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl"
        >
          <div className="text-7xl mb-6">🌟</div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            给孩子一个
            <span className="bg-gradient-to-r from-cute-coral to-cute-yellow bg-clip-text text-transparent">
              有规划
            </span>
            的童年
          </h1>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            描述孩子的作息习惯，AI 秒出周计划表。
            <br />
            每日打卡，培养好习惯，让成长看得见。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register" className="cute-button-primary text-lg px-8 py-4">
              免费开始使用
            </Link>
            <Link href="/login" className="cute-button-secondary text-lg px-8 py-4">
              登录
            </Link>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl w-full"
        >
          {[
            { emoji: "🤖", title: "AI 智能规划", desc: "描述孩子的作息，AI 自动生成合理的周计划" },
            { emoji: "✅", title: "每日打卡", desc: "完成任务打个勾，星星✨鼓励，养成好习惯" },
            { emoji: "📊", title: "进度可见", desc: "每周完成情况一目了然，家长轻松追踪" },
          ].map((f, i) => (
            <div key={i} className="cute-card text-center">
              <div className="text-4xl mb-3">{f.emoji}</div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mt-24 max-w-4xl w-full"
        >
          <h2 className="text-2xl font-black text-center mb-8">三步搞定</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: "1", emoji: "👶", title: "创建孩子档案", desc: "填写孩子姓名、年龄，描述日常作息" },
              { step: "2", emoji: "✨", title: "AI 生成周计划", desc: "输入本周安排，AI 自动排好每日任务" },
              { step: "3", emoji: "✅", title: "每天打卡", desc: "孩子自己勾选完成项，培养自律习惯" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-cute-yellow text-white font-black text-lg flex items-center justify-center mb-4">
                  {s.step}
                </div>
                <div className="text-3xl mb-2">{s.emoji}</div>
                <h3 className="font-bold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="text-center py-6 text-sm text-muted-foreground">
        小计划 &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
