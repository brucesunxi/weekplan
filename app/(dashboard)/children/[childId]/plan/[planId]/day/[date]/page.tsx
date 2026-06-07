"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Task, Plan, Child } from "@/types";
import { getChineseWeekday, calculateProgress, getCurrentTaskIndex } from "@/lib/utils";

export default function DayViewPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  const planId = params.planId as string;
  const childId = params.childId as string;
  const date = params.date as string;
  const weekday = getChineseWeekday(date);
  const dateDisplay = `${parseInt(date.split("-")[1])}月${parseInt(date.split("-")[2])}日`;

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/plans/${planId}/day/${date}`);
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setTasks(data.tasks || []);
      setProgress(data.progress || 0);
    } catch (err) {
      console.error(err);
    }
  }, [planId, date]);

  useEffect(() => {
    async function load() {
      try {
        const [planRes, childRes] = await Promise.all([
          fetch(`/api/plans/${planId}`),
          fetch(`/api/children/${childId}`),
        ]);
        if (!planRes.ok || !childRes.ok) {
          router.push("/children");
          return;
        }
        setPlan(await planRes.json());
        setChild(await childRes.json());
      } catch (err) {
        console.error(err);
      }
      await loadTasks();
      setLoading(false);
    }
    load();
  }, [planId, childId, router, loadTasks]);

  async function toggleTask(taskId: string, completed: boolean) {
    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, completed, completedAt: completed ? Date.now() : undefined }
          : t
      )
    );

    try {
      const res = await fetch(`/api/plans/${planId}/day/${date}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, completed }),
      });
      const data = await res.json();
      setProgress(data.dayProgress);

      // Celebration on 100%
      if (data.dayProgress === 100) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 3000);
      }
    } catch {
      // Revert on error
      loadTasks();
    }
  }

  // Current task indicator
  const [currentIndex, setCurrentIndex] = useState(-1);
  useEffect(() => {
    function updateCurrent() {
      setCurrentIndex(getCurrentTaskIndex(tasks));
    }
    updateCurrent();
    const interval = setInterval(updateCurrent, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-4xl animate-spin">🌟</div>
      </div>
    );
  }

  const sortedTasks = [...tasks].sort(
    (a, b) => a.time.localeCompare(b.time)
  );
  const completedCount = tasks.filter((t) => t.completed).length;

  // Find next uncompleted task
  const nextTask = sortedTasks.find((t) => !t.completed);

  return (
    <div>
      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="text-center"
            >
              <div className="text-8xl mb-4">🎉</div>
              <div className="text-3xl font-black text-white drop-shadow-lg">
                太棒了！全部完成！
              </div>
              <div className="text-xl text-white/80 mt-2">
                {child?.name} 今天真棒！
              </div>
            </motion.div>
            {/* Confetti particles */}
            {["🌟", "⭐", "✨", "🎉", "🎊"].map((emoji, i) => (
              <motion.div
                key={i}
                initial={{ y: 0, x: 0, opacity: 1 }}
                animate={{
                  y: -300 - Math.random() * 200,
                  x: (Math.random() - 0.5) * 400,
                  opacity: 0,
                  rotate: 720,
                }}
                transition={{ duration: 1.5, delay: i * 0.1 }}
                className="absolute text-3xl"
                style={{ left: `${20 + i * 15}%`, bottom: "40%" }}
              >
                {emoji}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with back link */}
      <div className="mb-4">
        <Link
          href={`/children/${childId}/plan/${planId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 返回周计划
        </Link>
      </div>

      {/* Day header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cute-card mb-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{child?.avatar}</span>
              <div>
                <h1 className="text-xl font-black">
                  {weekday} · {dateDisplay}
                </h1>
                <p className="text-sm text-muted-foreground">{child?.name} 的日程</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-cute-sky">{progress}%</div>
            <p className="text-xs text-muted-foreground">
              {completedCount}/{tasks.length} 已完成
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="progress-bar mt-3">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Next task reminder */}
        {nextTask && progress < 100 && (
          <div className="mt-3 bg-cute-yellow/20 rounded-2xl px-4 py-2 flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <span className="text-sm font-medium">
              下一个：{nextTask.emoji} {nextTask.title} · {nextTask.time}
              {nextTask.endTime ? `-${nextTask.endTime}` : ""}
            </span>
          </div>
        )}
      </motion.div>

      {/* Task list */}
      <div className="space-y-2">
        {sortedTasks.map((task, i) => {
          const isCurrent = i === currentIndex;
          const isPast = task.time < new Date().toTimeString().slice(0, 5);

          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <button
                onClick={() => toggleTask(task.id, !task.completed)}
                className={`w-full text-left cute-card flex items-center gap-3 p-4 transition-all ${
                  task.completed
                    ? "opacity-60 bg-muted/50"
                    : isCurrent
                    ? "ring-2 ring-cute-sky bg-cute-sky/5"
                    : "hover:border-primary-200"
                }`}
              >
                {/* Checkbox */}
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all ${
                    task.completed
                      ? "bg-cute-mint text-white"
                      : "bg-muted border-2 border-border"
                  }`}
                >
                  {task.completed ? "✓" : ""}
                </div>

                {/* Task info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{task.emoji}</span>
                    <span
                      className={`font-bold ${
                        task.completed ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {task.time}
                    {task.endTime ? ` - ${task.endTime}` : ""}
                    {task.note && ` · ${task.note}`}
                  </div>
                </div>

                {/* Category badge */}
                <span
                  className="text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0"
                  style={{
                    backgroundColor: getCategoryBg(task.category),
                    color: getCategoryText(task.category),
                  }}
                >
                  {getCategoryLabel(task.category)}
                </span>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="cute-card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-muted-foreground">今天还没有安排任务</p>
        </div>
      )}
    </div>
  );
}

// Category helpers
const categoryMeta: Record<string, { label: string; bg: string; text: string }> = {
  study: { label: "学习", bg: "#FFF0F5", text: "#D63384" },
  play: { label: "玩乐", bg: "#E8F8F5", text: "#0E7C7B" },
  meal: { label: "餐饮", bg: "#FFF8E1", text: "#F57F17" },
  sleep: { label: "休息", bg: "#F3E5F5", text: "#7B1FA2" },
  sport: { label: "运动", bg: "#E8F5E9", text: "#388E3C" },
  other: { label: "其他", bg: "#FFF3E0", text: "#E65100" },
};

function getCategoryBg(cat: string): string {
  return categoryMeta[cat]?.bg || "#F5F5F5";
}
function getCategoryText(cat: string): string {
  return categoryMeta[cat]?.text || "#666";
}
function getCategoryLabel(cat: string): string {
  return categoryMeta[cat]?.label || cat;
}
