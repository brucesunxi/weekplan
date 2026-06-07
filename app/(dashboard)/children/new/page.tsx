"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { AnimalAvatar } from "@/types";
import { AVATAR_OPTIONS } from "@/types";

export default function NewChildPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<AnimalAvatar>("🐼");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          age: parseInt(age),
          bio,
          avatar,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "创建失败");
        setLoading(false);
        return;
      }

      router.push("/children");
    } catch {
      setError("网络错误");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black mb-1">添加孩子</h1>
        <p className="text-sm text-muted-foreground mb-6">
          填写孩子信息，描述日常作息，后续 AI 会根据这些生成周计划
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-bold mb-2">选择头像</label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt.emoji}
                  type="button"
                  onClick={() => setAvatar(opt.emoji)}
                  className={`text-3xl w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                    avatar === opt.emoji
                      ? "bg-primary-100 ring-2 ring-primary-400 scale-110"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {opt.emoji}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">名字</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="如：小明"
              className="cute-input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">年龄</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="如：6"
              className="cute-input"
              min={1}
              max={18}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1">
              日常作息描述
              <span className="text-muted-foreground font-normal ml-1">（选填，后续可以在生成计划时补充）</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="描述孩子的日常作息习惯，例如：&#10;小明今年6岁，上小学一年级，平时早上7点起床，晚上9点睡觉。周一有钢琴课，周三有画画课..."
              className="cute-input min-h-[120px] resize-y"
              rows={4}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="cute-button-secondary flex-1"
            >
              取消
            </button>
            <button type="submit" className="cute-button-primary flex-1" disabled={loading}>
              {loading ? "创建中..." : "创建"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
