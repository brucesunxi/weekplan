"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { Child, InputMode, StructuredInput } from "@/types";
import PlanFormStructured from "@/components/plan-form-structured";

// Speech recognition
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

const SpeechRecognitionAPI =
  typeof window !== "undefined" &&
  ((window as unknown as Record<string, unknown>).SpeechRecognition ||
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition) as
    | (new () => {
        lang: string
        continuous: boolean
        interimResults: boolean
        start: () => void
        onresult: (e: SpeechRecognitionEvent) => void
        onerror: () => void
        onend: () => void
      })
    | undefined;

const SUGGESTION_GROUPS = [
  {
    label: "⏰ 作息",
    items: [
      "中午午休1小时",
      "每天保证10小时睡眠",
    ],
  },
  {
    label: "📚 课程",
    items: [
      "周一三五有钢琴课，下午4点到5点半",
      "周二周四有英语课，晚上6点到7点",
      "周六上午有画画课",
      "周日下午有编程课",
    ],
  },
  {
    label: "📖 学习习惯",
    items: [
      "每天课外阅读30分钟",
      "每天练字20分钟",
      "每天完成学校作业",
      "每周背诵一首古诗",
    ],
  },
  {
    label: "⚽ 运动玩乐",
    items: [
      "每天户外活动至少1小时",
      "周末去公园或博物馆",
      "每天自由玩耍时间",
      "每周游泳一次",
    ],
  },
  {
    label: "🍚 饮食",
    items: [
      "早上8点前吃完早餐",
      "中午12点午餐",
      "晚上6点半晚餐",
      "少吃零食，多吃水果",
    ],
  },
  {
    label: "🌟 习惯培养",
    items: [
      "自己整理书包和房间",
      "每天洗澡刷牙",
      "控制看电视时间",
      "每天练琴30分钟",
    ],
  },
];

export default function PlanNewPage() {
  const params = useParams();
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [mode, setMode] = useState<InputMode>("natural");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [listening, setListening] = useState(false);

  useEffect(() => {
    fetch(`/api/children/${params.childId}`)
      .then((r) => r.json())
      .then(setChild)
      .catch(console.error);
  }, [params.childId]);

  // Voice recognition
  const toggleListening = useCallback(() => {
    if (listening) {
      setListening(false);
      return;
    }

    if (!SpeechRecognitionAPI) {
      alert("语音识别需要 Chrome 浏览器");
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => (prev ? `${prev}\n${transcript}` : transcript));
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
    setListening(true);
  }, [listening]);

  async function submitNatural(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    await generatePlan("natural", { description: description.trim() });
  }

  async function submitStructured(data: StructuredInput) {
    await generatePlan("structured", { structured: data });
  }

  async function generatePlan(submitMode: InputMode, extra: Record<string, unknown>) {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId: params.childId,
          mode: submitMode,
          ...extra,
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

  return (
    <div className="max-w-2xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-black mb-1">
          为 {child?.name || "..."} 生成周计划
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          AI 会自动根据孩子的作息生成一份合理的周计划表
        </p>

        {/* Mode Tabs */}
        <div className="flex bg-muted rounded-2xl p-1 mb-6">
          <button
            type="button"
            onClick={() => setMode("natural")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === "natural" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🎤 直接说
          </button>
          <button
            type="button"
            onClick={() => setMode("structured")}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === "structured" ? "bg-white shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📋 表格填写
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-500 bg-red-50 rounded-xl px-3 py-2 mb-4">{error}</p>
        )}

        {/* Natural Language Mode */}
        {mode === "natural" && (
          <form onSubmit={submitNatural} className="space-y-5">
            {/* Quick sleep/wake presets */}
            <div className="cute-card">
              <h3 className="font-bold flex items-center gap-1 mb-3">🛏️ 作息时间</h3>
              <p className="text-xs text-muted-foreground mb-3">选好时间点一下，自动添加到描述中</p>
              <div className="flex flex-wrap gap-2">
                {["06:30", "07:00", "07:30", "08:00"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDescription((prev) => `${prev ? `${prev}\n` : ""}每天早上${t}起床`)}
                    className="flex items-center gap-1.5 bg-white border border-border rounded-xl px-3 py-2 text-sm hover:border-cute-yellow hover:bg-cute-yellow/10 transition-all"
                  >
                    <span>🌅</span>
                    <span className="font-bold">{t}</span>
                    <span className="text-muted-foreground">起床</span>
                  </button>
                ))}
                {["20:30", "21:00", "21:30", "22:00"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDescription((prev) => `${prev ? `${prev}\n` : ""}每天晚上${t}睡觉`)}
                    className="flex items-center gap-1.5 bg-white border border-border rounded-xl px-3 py-2 text-sm hover:border-cute-lavender hover:bg-cute-lavender/10 transition-all"
                  >
                    <span>🌙</span>
                    <span className="font-bold">{t}</span>
                    <span className="text-muted-foreground">睡觉</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea with voice button */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold">描述本周安排</label>
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl font-bold transition-all ${
                    listening
                      ? "bg-red-100 text-red-600 animate-pulse"
                      : "bg-muted text-muted-foreground hover:bg-primary-100 hover:text-primary-700"
                  }`}
                >
                  <span className="text-lg">{listening ? "🔴" : "🎤"}</span>
                  {listening ? "录音中..." : "语音输入"}
                </button>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`说说 ${child?.name || "孩子"} 的作息安排吧，比如：\n每天7点起床，9点睡觉\n周一三五有钢琴课\n每天要读30分钟书`}
                className="cute-input min-h-[160px] resize-y"
                rows={6}
                required
              />
            </div>

            {/* Quick suggestions - categorized */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">💡 想不到怎么描述？点这些快捷短语添加到描述中：</p>
              <div className="space-y-3">
                {SUGGESTION_GROUPS.map((group) => (
                  <div key={group.label}>
                    <p className="text-xs font-bold text-muted-foreground mb-1.5">{group.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.items.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setDescription((prev) => (prev ? `${prev}\n${item}` : item))}
                          className="text-xs bg-white border border-border rounded-xl px-3 py-1.5 hover:border-primary-300 hover:bg-primary-50 transition-all"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="cute-button-primary w-full"
              disabled={loading || !description.trim()}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">✨</span> AI 正在生成...
                </span>
              ) : (
                "✨ 生成周计划"
              )}
            </button>
          </form>
        )}

        {/* Structured Mode */}
        {mode === "structured" && (
          <PlanFormStructured onSubmit={submitStructured} loading={loading} />
        )}
      </motion.div>
    </div>
  );
}
