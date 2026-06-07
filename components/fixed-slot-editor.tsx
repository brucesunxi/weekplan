"use client";

import { useState } from "react";
import type { FixedSlot } from "@/types";
import { DAY_NAMES, DAY_NAMES_SHORT } from "@/types";

const EMOJI_OPTIONS = ["📚", "🎹", "🎨", "⚽", "🏊", "🎵", "💃", "🤸", "🧮", "🔬", "🌍", "💻", "✏️", "🎭", "♟️", "🧩"];

const PRESETS = [
  { label: "每天", getDays: () => [0,1,2,3,4,5,6] },
  { label: "周一至周五", getDays: () => [1,2,3,4,5] },
  { label: "周末", getDays: () => [0,6] },
  { label: "周一三", getDays: () => [1,3] },
  { label: "周二四", getDays: () => [2,4] },
];

interface Props {
  slots: FixedSlot[]
  onChange: (slots: FixedSlot[]) => void
}

export default function FixedSlotEditor({ slots, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1,2,3,4,5]);
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("📚");

  function toggleDay(d: number) {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  function usePreset(preset: typeof PRESETS[0]) {
    setSelectedDays(preset.getDays());
  }

  function addSlot() {
    if (!title.trim() || selectedDays.length === 0) return;
    const newSlot: FixedSlot = {
      id: crypto.randomUUID(),
      days: [...selectedDays],
      startTime,
      endTime,
      title: title.trim(),
      emoji,
    };
    onChange([...slots, newSlot]);
    setTitle("");
    setShowForm(false);
  }

  function removeSlot(id: string) {
    onChange(slots.filter((s) => s.id !== id));
  }

  function dayLabel(days: number[]): string {
    if (days.length === 7) return "每天";
    if (days.length === 5 && days.every((d) => d >= 1 && d <= 5)) return "周一至周五";
    if (days.length === 2 && days.includes(0) && days.includes(6)) return "周末";
    return days.map((d) => DAY_NAMES_SHORT[d]).join("、");
  }

  const weekdaySlots = slots.filter((s) => s.days.some((d) => d >= 1 && d <= 5));
  const weekendSlots = slots.filter((s) => s.days.some((d) => d === 0 || d === 6));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-1">📅 固定时间安排</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-primary-100 text-primary-700 px-3 py-1.5 rounded-xl font-bold hover:bg-primary-200 transition-colors"
        >
          ＋ 添加
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">每周固定要上课或参加活动的时间段</p>

      {/* Add form */}
      {showForm && (
        <div className="bg-muted rounded-2xl p-4 mb-3 space-y-3">
          {/* Day presets */}
          <div>
            <label className="text-xs font-bold mb-1 block">重复</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => usePreset(p)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-bold transition-all ${
                    JSON.stringify(selectedDays) === JSON.stringify(p.getDays())
                      ? "bg-primary-200 text-primary-800"
                      : "bg-white text-muted-foreground hover:bg-primary-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {/* Individual day toggles */}
            <div className="flex gap-1">
              {DAY_NAMES.map((name, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    selectedDays.includes(i)
                      ? "bg-primary-400 text-white"
                      : "bg-white text-muted-foreground hover:bg-primary-100"
                  }`}
                >
                  {DAY_NAMES_SHORT[i]}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold mb-1 block">开始</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="cute-input text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">结束</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="cute-input text-sm" />
            </div>
          </div>

          {/* Emoji + Title */}
          <div className="flex gap-2 items-end">
            <div>
              <label className="text-xs font-bold mb-1 block">图标</label>
              <div className="flex gap-0.5">
                {EMOJI_OPTIONS.slice(0, 8).map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`text-lg w-8 h-8 rounded-lg flex items-center justify-center ${
                      emoji === e ? "bg-primary-200 ring-2 ring-primary-400" : "bg-white hover:bg-primary-100"
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold mb-1 block">活动名称</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="如：钢琴课"
                className="cute-input text-sm"
                onKeyDown={(e) => e.key === "Enter" && addSlot()}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="cute-button-secondary text-sm flex-1">取消</button>
            <button type="button" onClick={addSlot} className="cute-button-primary text-sm flex-1" disabled={!title.trim() || selectedDays.length === 0}>确定</button>
          </div>
        </div>
      )}

      {/* Slot list */}
      {slots.length > 0 && (
        <div className="space-y-1">
          {[...slots].sort((a, b) => Math.min(...a.days) - Math.min(...b.days)).map((slot) => {
            const hasWeekday = slot.days.some((d) => d >= 1 && d <= 5);
            const hasWeekend = slot.days.some((d) => d === 0 || d === 6);
            return (
              <div
                key={slot.id}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 border text-sm group ${
                  hasWeekend && !hasWeekday
                    ? "bg-cute-yellow/10 border-cute-yellow/30"
                    : "bg-white border-border"
                }`}
              >
                <span>{slot.emoji}</span>
                <span className="font-bold text-xs w-20">{dayLabel(slot.days)}</span>
                <span className="text-muted-foreground text-xs">{slot.startTime}-{slot.endTime}</span>
                <span className="flex-1">{slot.title}</span>
                <button
                  type="button"
                  onClick={() => removeSlot(slot.id)}
                  className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {slots.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-4">还没有添加固定时间</p>
      )}
    </div>
  );
}
