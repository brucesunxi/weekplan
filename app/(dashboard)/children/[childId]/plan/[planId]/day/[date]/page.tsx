"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Task, Plan, Child } from "@/types";
import { getChineseWeekday, calculateProgress, getCurrentTaskIndex } from "@/lib/utils";

const CATEGORY_META: Record<string, { label: string; bg: string; text: string }> = {
  study: { label: "学习", bg: "#FFF0F5", text: "#D63384" },
  play: { label: "玩乐", bg: "#E8F8F5", text: "#0E7C7B" },
  meal: { label: "餐饮", bg: "#FFF8E1", text: "#F57F17" },
  sleep: { label: "休息", bg: "#F3E5F5", text: "#7B1FA2" },
  sport: { label: "运动", bg: "#E8F5E9", text: "#388E3C" },
  other: { label: "其他", bg: "#FFF3E0", text: "#E65100" },
};

export default function DayViewPage() {
  const params = useParams();
  const router = useRouter();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  // Edit form state for new task
  const [newTaskTime, setNewTaskTime] = useState("08:00");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskEmoji, setNewTaskEmoji] = useState("✅");

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
        if (!planRes.ok || !childRes.ok) { router.push("/children"); return; }
        setPlan(await planRes.json());
        setChild(await childRes.json());
      } catch (err) { console.error(err); }
      await loadTasks();
      setLoading(false);
    }
    load();
  }, [planId, childId, router, loadTasks]);

  async function toggleTask(taskId: string, completed: boolean) {
    if (editing) return; // Don't toggle in edit mode
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, completed, completedAt: completed ? Date.now() : undefined } : t));
    try {
      const res = await fetch(`/api/plans/${planId}/day/${date}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, completed }),
      });
      const data = await res.json();
      setProgress(data.dayProgress);
      if (data.dayProgress === 100) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 3000);
      }
    } catch { loadTasks(); }
  }

  // Edit mode: update task field
  function updateTaskField(taskId: string, field: string, value: string) {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, [field]: value } : t));
  }

  // Edit mode: delete a task
  function deleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  // Edit mode: add a new task
  function addTask() {
    if (!newTaskTitle.trim()) return;
    const newId = `edit-${Date.now()}`;
    setTasks((prev) => [...prev, {
      id: newId,
      time: newTaskTime,
      endTime: "",
      title: newTaskTitle.trim(),
      emoji: newTaskEmoji,
      category: "other",
      completed: false,
    }]);
    setNewTaskTitle("");
  }

  // Save all edits
  async function saveEdits() {
    setSaving(true);
    try {
      const cleanTasks = tasks.map((t) => ({
        id: t.id,
        time: t.time,
        endTime: t.endTime || "",
        title: t.title,
        emoji: t.emoji,
        category: t.category,
        completed: t.completed,
        completedAt: t.completedAt,
        note: t.note,
      }));
      const res = await fetch(`/api/plans/${planId}/day/${date}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: cleanTasks }),
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data.dayProgress || calculateProgress(cleanTasks));
        setEditing(false);
      }
    } catch { /* ignore */ }
    setSaving(false);
  }

  // Current task indicator
  const [currentIndex, setCurrentIndex] = useState(-1);
  useEffect(() => {
    function update() { setCurrentIndex(getCurrentTaskIndex(tasks)); }
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [tasks]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="text-4xl animate-spin">🌟</div></div>;
  }

  const sortedTasks = [...tasks].sort((a, b) => a.time.localeCompare(b.time));
  const completedCount = tasks.filter((t) => t.completed).length;
  const nextTask = sortedTasks.find((t) => !t.completed);

  return (
    <div>
      {/* Celebration overlay */}
      <AnimatePresence>
        {celebrating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="text-center">
              <div className="text-8xl mb-4">🎉</div>
              <div className="text-3xl font-black text-white drop-shadow-lg">太棒了！全部完成！</div>
              <div className="text-xl text-white/80 mt-2">{child?.name} 今天真棒！</div>
            </motion.div>
            {["🌟", "⭐", "✨", "🎉", "🎊"].map((e, i) => (
              <motion.div key={i} initial={{ y: 0, x: 0, opacity: 1 }} animate={{ y: -300 - Math.random() * 200, x: (Math.random() - 0.5) * 400, opacity: 0, rotate: 720 }} transition={{ duration: 1.5, delay: i * 0.1 }} className="absolute text-3xl" style={{ left: `${20 + i * 15}%`, bottom: "40%" }}>{e}</motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <Link href={`/children/${childId}/plan/${planId}`} className="text-sm text-muted-foreground hover:text-foreground">← 返回周计划</Link>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="text-sm bg-muted px-3 py-1.5 rounded-xl font-bold hover:bg-primary-100 transition-colors">✏️ 编辑</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { loadTasks(); setEditing(false); }} className="text-sm cute-button-secondary px-3 py-1.5" disabled={saving}>取消</button>
            <button onClick={saveEdits} className="text-sm cute-button-primary px-3 py-1.5" disabled={saving}>{saving ? "保存中..." : "💾 保存"}</button>
          </div>
        )}
      </div>

      {/* Day header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="cute-card mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{child?.avatar}</span>
            <div>
              <h1 className="text-xl font-black">{weekday} · {dateDisplay}</h1>
              <p className="text-sm text-muted-foreground">{child?.name} 的日程</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-cute-sky">{progress}%</div>
            <p className="text-xs text-muted-foreground">{completedCount}/{tasks.length} 已完成</p>
          </div>
        </div>
        <div className="progress-bar mt-3">
          <motion.div className="progress-bar-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
        </div>
        {nextTask && progress < 100 && !editing && (
          <div className="mt-3 bg-cute-yellow/20 rounded-2xl px-4 py-2 flex items-center gap-2">
            <span className="text-lg">⏰</span>
            <span className="text-sm font-medium">下一个：{nextTask.emoji} {nextTask.title} · {nextTask.time}{nextTask.endTime ? `-${nextTask.endTime}` : ""}</span>
          </div>
        )}
        {editing && <div className="mt-3 bg-cute-pink/10 rounded-2xl px-4 py-2 text-xs text-muted-foreground">✏️ 编辑模式：点击任务可修改时间和名称，也可删除或添加任务</div>}
      </motion.div>

      {/* Task list */}
      <div className="space-y-2">
        {sortedTasks.map((task, i) => {
          const cat = CATEGORY_META[task.category] || CATEGORY_META.other;
          const isCurrent = i === currentIndex;

          if (editing) {
            return (
              <div key={task.id} className="cute-card flex items-center gap-2 p-3">
                <div className="flex-1 grid grid-cols-[auto_1fr_auto] gap-2 items-center">
                  <input
                    type="time"
                    value={task.time}
                    onChange={(e) => updateTaskField(task.id, "time", e.target.value)}
                    className="text-sm bg-muted rounded-lg px-2 py-1.5 w-20 text-center font-bold"
                  />
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => updateTaskField(task.id, "title", e.target.value)}
                    className="text-sm bg-muted rounded-lg px-2 py-1.5 w-full"
                  />
                  <input
                    type="text"
                    value={task.emoji}
                    onChange={(e) => updateTaskField(task.id, "emoji", e.target.value)}
                    className="text-sm bg-muted rounded-lg px-2 py-1.5 w-10 text-center"
                  />
                </div>
                <button onClick={() => deleteTask(task.id)} className="text-red-400 hover:text-red-600 text-sm px-1">✕</button>
              </div>
            );
          }

          return (
            <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
              <button
                onClick={() => toggleTask(task.id, !task.completed)}
                className={`w-full text-left cute-card flex items-center gap-3 p-4 transition-all ${task.completed ? "opacity-60 bg-muted/50" : isCurrent ? "ring-2 ring-cute-sky bg-cute-sky/5" : "hover:border-primary-200"}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0 transition-all ${task.completed ? "bg-cute-mint text-white" : "bg-muted border-2 border-border"}`}>
                  {task.completed ? "✓" : ""}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{task.emoji}</span>
                    <span className={`font-bold ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {task.time}{task.endTime ? ` - ${task.endTime}` : ""}{task.note ? ` · ${task.note}` : ""}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0" style={{ backgroundColor: cat.bg, color: cat.text }}>{cat.label}</span>
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Add task form (edit mode) */}
      {editing && (
        <div className="cute-card mt-3">
          <h4 className="font-bold text-sm mb-2">➕ 添加任务</h4>
          <div className="flex gap-2 items-end">
            <div>
              <label className="text-xs text-muted-foreground mb-0.5 block">时间</label>
              <input type="time" value={newTaskTime} onChange={(e) => setNewTaskTime(e.target.value)} className="cute-input text-sm w-24" />
            </div>
            <div className="flex-1">
              <label className="text-xs text-muted-foreground mb-0.5 block">名称</label>
              <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="新任务" className="cute-input text-sm"
                onKeyDown={(e) => e.key === "Enter" && addTask()} />
            </div>
            <button onClick={addTask} disabled={!newTaskTitle.trim()} className="cute-button-primary text-sm px-4 py-2">添加</button>
          </div>
        </div>
      )}

      {tasks.length === 0 && !editing && (
        <div className="cute-card text-center py-12">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-muted-foreground">今天还没有安排任务</p>
        </div>
      )}
    </div>
  );
}
