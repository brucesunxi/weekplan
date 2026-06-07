"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Plan, Child, Task } from "@/types";
import { getWeekDays, getChineseWeekday, calculateProgress } from "@/lib/utils";

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [dayTasks, setDayTasks] = useState<Record<string, Task[]>>({});
  const [dayProgress, setDayProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const planId = params.planId as string;
  const childId = params.childId as string;
  const weekDays = plan ? getWeekDays(new Date(plan.weekStart)) : [];

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

        // Load each day's tasks
        const days = getWeekDays(new Date(planData.weekStart));
        const tasksMap: Record<string, Task[]> = {};
        const progressMap: Record<string, number> = {};

        const results = await Promise.all(
          days.map((date) =>
            fetch(`/api/plans/${planId}/day/${date}`).then((r) => r.json())
          )
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-4xl animate-spin">🌟</div>
      </div>
    );
  }

  if (!plan || !child) return null;

  const today = new Date().toISOString().split("T")[0];
  const totalProgress = Math.round(
    weekDays.reduce((sum, d) => sum + (dayProgress[d] || 0), 0) / weekDays.length
  );

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cute-card mb-6"
      >
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={`/children/${childId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            ← {child.name}
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black">
              {plan.weekStart} ~ {plan.weekEnd}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
              {plan.userDescription}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-cute-sky">{totalProgress}%</div>
            <p className="text-xs text-muted-foreground">本周总进度</p>
          </div>
        </div>
        {/* Overall progress bar */}
        <div className="progress-bar mt-3">
          <div
            className="progress-bar-fill"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </motion.div>

      {/* Weekly Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((date, i) => {
          const tasks = dayTasks[date] || [];
          const progress = dayProgress[date] || 0;
          const isToday = date === today;
          const isFuture = date > today;
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
                    isToday
                      ? "ring-2 ring-primary-400 bg-primary-50/30"
                      : "hover:border-primary-200"
                  }`}
                >
                  {/* Day header */}
                  <div className="text-center mb-2">
                    <div className="text-xs text-muted-foreground">{getChineseWeekday(date)}</div>
                    <div
                      className={`text-2xl font-black ${
                        isToday ? "text-primary-500" : ""
                      }`}
                    >
                      {dayNum}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="progress-bar mb-2">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Task preview */}
                  <div className="space-y-1">
                    {tasks.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        className={`flex items-center gap-1 text-xs ${
                          task.completed
                            ? "text-muted-foreground line-through"
                            : ""
                        }`}
                      >
                        <span>{task.emoji}</span>
                        <span className="truncate">{task.title}</span>
                      </div>
                    ))}
                    {tasks.length > 4 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{tasks.length - 4} 项
                      </div>
                    )}
                    {tasks.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center">
                        {isFuture ? "待安排" : "暂无任务"}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
