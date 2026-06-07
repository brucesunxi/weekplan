"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Child } from "@/types";

export default function PlanNewPage() {
  const params = useParams();
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/children/${params.childId}`)
      .then((r) => r.json())
      .then(setChild)
      .catch(console.error);
  }, [params.childId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: params.childId,
          description: description.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "生成失败");
        setLoading(false);
        return;
      }

      router.push(`/children/${params.childId}/plan/${data.planId}`);
    } catch {
      setError("网络错误，请重试");
      setLoading(false);
    }
  }

  function getSuggestions(): string {
    if (!child) return "";
    return `我是 ${child.name} 的家长，${child.name} 今年 ${child.age} 岁。${child.bio || ""}`;
  }

  const suggestions = [
    "周一三五有钢琴课，周二周四有英语课",
    "早上7点起床，晚上9点睡觉",
    "每天需要1小时户外活动",
    "周末想带他去公园和博物馆",
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black mb-1">
          为 {child?.name || "..."} 生成周计划
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          描述孩子本周的作息安排，AI 会自动生成一份合理的周计划
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold mb-2">描述本周安排</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`${getSuggestions()}\n\n例如：\n${suggestions.join("\n")}`}
              className="cute-input min-h-[200px] resize-y"
              rows={8}
              required
            />
          </div>

          {/* Quick suggestions */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">快捷添加（点击添加）：</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setDescription((prev) => (prev ? `${prev}\n${s}` : `${getSuggestions()}\n${s}`))}
                  className="text-xs bg-muted rounded-xl px-3 py-1.5 hover:bg-muted/80 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
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
            <button
              type="submit"
              className="cute-button-primary flex-[2]"
              disabled={loading || !description.trim()}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">✨</span> AI 正在生成...
                </span>
              ) : (
                "✨ 生成周计划"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
