"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Plan, Child, Task, TaskCategory } from "@/types";
import { getWeekDays, getChineseWeekday, calculateProgress, parseLocalDate } from "@/lib/utils";
import { CATEGORY_META } from "@/types";

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [dayTasks, setDayTasks] = useState<Record<string, Task[]>>({});
  const [dayProgress, setDayProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const planId = params.planId as string;
  const childId = params.childId as string;
  const weekDays = plan ? getWeekDays(parseLocalDate(plan.weekStart)) : [];

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

        const planData = await planRes.json();
        setPlan(planData);
        setChild(await childRes.json());

        const days = getWeekDays(parseLocalDate(planData.weekStart));
        const tasksMap: Record<string, Task[]> = {};
        const progressMap: Record<string, number> = {};

        const results = await Promise.all(
          days.map(async (date) => {
            try {
              const res = await fetch(`/api/plans/${planId}/day/${date}`);
              return res.ok ? await res.json() : { tasks: [], progress: 0 };
            } catch {
              return { tasks: [], progress: 0 };
            }
          })
        );

        days.forEach((date, i) => {
          tasksMap[date] = results[i]?.tasks || [];
          progressMap[date] = results[i]?.progress || 0;
        });

        setDayTasks(tasksMap);
        setDayProgress(progressMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [planId, childId, router]);

  async function handleDelete() {
    if (!confirm("确定要删除这个周计划吗？删除后不可恢复。")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
      if (res.ok) router.push(`/children/${childId}`);
    } catch {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-4xl animate-spin">🌟</div>
      </div>
    );
  }

  if (!plan || !child) return null;

  const today = new Date().toISOString().split("T")[0];
  const allTasks = Object.values(dayTasks).flat();
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const totalProgress = Math.round(
    weekDays.reduce((sum, d) => sum + (dayProgress[d] || 0), 0) / weekDays.length
  );

  // Category breakdown
  const catCount: Record<string, number> = {};
  for (const t of allTasks) {
    catCount[t.category] = (catCount[t.category] || 0) + 1;
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cute-card mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <Link href={`/children/${childId}`} className="text-muted-foreground hover:text-foreground">
            ← {child.name}
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            {deleting ? "删除中..." : "🗑️ 删除计划"}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">
              {plan.weekStart} ~ {plan.weekEnd}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {plan.userDescription}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-cute-sky">{totalProgress}%</div>
            <p className="text-xs text-muted-foreground">本周总进度</p>
          </div>
        </div>
        <div className="progress-bar mt-3">
          <div className="progress-bar-fill" style={{ width: `${totalProgress}%` }} />
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span>📋 共 {totalTasks} 项任务</span>
          <span>✅ 已完成 {completedTasks}</span>
          <span>📅 {weekDays.length} 天</span>
        </div>
      </motion.div>

      {/* Weekly Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-6">
        {weekDays.map((date, i) => {
          const tasks = dayTasks[date] || [];
          const progress = dayProgress[date] || 0;
          const isToday = date === today;
          const dayNum = parseInt(date.split("-")[2]);

          return (
            <motion.div
              key={date}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/children/${childId}/plan/${planId}/day/${date}`}>
                <div
                  className={`cute-card p-3 md:p-4 cursor-pointer transition-all h-full ${
                    isToday ? "ring-2 ring-primary-400 bg-primary-50/30" : "hover:border-primary-200"
                  }`}
                >
                  <div className="text-center mb-2">
                    <div className="text-xs text-muted-foreground">{getChineseWeekday(date)}</div>
                    <div className={`text-2xl font-black ${isToday ? "text-primary-500" : ""}`}>{dayNum}</div>
                  </div>
                  <div className="progress-bar mb-2">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="space-y-1">
                    {tasks.slice(0, 4).map((task) => (
                      <div key={task.id} className={`flex items-center gap-1 text-xs ${task.completed ? "text-muted-foreground line-through" : ""}`}>
                        <span>{task.emoji}</span>
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {tasks.length > 4 && <div className="text-xs text-muted-foreground text-center">+{tasks.length - 4} 项</div>}
                    {tasks.length === 0 && <div className="text-xs text-muted-foreground text-center">暂无任务</div>}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Plan Explanation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="cute-card"
      >
        <h2 className="font-bold text-lg mb-3">📊 本周计划概览</h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          这是为 <strong>{child.name}</strong>（{child.age}岁）制定的 {plan.weekStart} 至 {plan.weekEnd} 的周计划。
          {plan.userDescription && ` 根据 "${plan.userDescription}" 生成。`}
          每天安排了 {weekDays.map((d) => `${getChineseWeekday(d)}${dayTasks[d]?.length || 0}项`).join("、")} 任务。
        </p>

        {/* Category breakdown */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(Object.keys(catCount) as TaskCategory[]).map((cat) => (
            <span
              key={cat}
              className="text-xs px-2.5 py-1 rounded-lg font-medium"
              style={{ backgroundColor: CATEGORY_META[cat]?.color + "30", color: CATEGORY_META[cat]?.color }}
            >
              {CATEGORY_META[cat]?.label || cat} {catCount[cat]}项
            </span>
          ))}
        </div>

        {/* Daily breakdown */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-muted-foreground">每日任务分布</p>
          {weekDays.map((date) => {
            const tasks = dayTasks[date] || [];
            const progress = dayProgress[date] || 0;
            return (
              <div key={date} className="flex items-center gap-2 text-sm">
                <span className="w-10 text-xs font-bold">{getChineseWeekday(date)}</span>
                <div className="progress-bar flex-1 max-w-[200px]">
                  <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-xs text-muted-foreground w-16">
                  {tasks.filter((t) => t.completed).length}/{tasks.length}
                </span>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="mt-4 bg-cute-yellow/10 rounded-2xl p-3">
          <p className="text-xs font-bold mb-1">💡 小提示</p>
          <p className="text-xs text-muted-foreground">
            点击任意一天的卡片进入日视图打卡。完成的任务会自动标记，进度实时更新。
            在日视图中可以编辑任务时间和名称，也可以添加或删除任务。
          </p>
        </div>
      </motion.div>
    </div>
  );
}
