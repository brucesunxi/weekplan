"use client";

import { useState } from "react";
import type { FixedSlot } from "@/types";
import { DAY_NAMES } from "@/types";

const EMOJI_OPTIONS = ["📚", "🎹", "🎨", "⚽", "🏊", "🎵", "💃", "🤸", "🧮", "🔬", "🌍", "💻", "✏️", "🎭", "♟️", "🧩"];

interface Props {
  slots: FixedSlot[]
  onChange: (slots: FixedSlot[]) => void
}

export default function FixedSlotEditor({ slots, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [day, setDay] = useState(1);
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("17:00");
  const [title, setTitle] = useState("");
  const [emoji, setEmoji] = useState("📚");

  function addSlot() {
    if (!title.trim()) return;
    const newSlot: FixedSlot = {
      id: crypto.randomUUID(),
      dayOfWeek: day,
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

  const weekdaySlots = slots.filter((s) => s.dayOfWeek >= 1 && s.dayOfWeek <= 5);
  const weekendSlots = slots.filter((s) => s.dayOfWeek === 0 || s.dayOfWeek === 6);

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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold mb-1 block">星期</label>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="cute-input text-sm"
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">图标</label>
              <div className="flex flex-wrap gap-1">
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
            <div>
              <label className="text-xs font-bold mb-1 block">开始</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="cute-input text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">结束</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="cute-input text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold mb-1 block">活动名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：钢琴课、英语班"
              className="cute-input text-sm"
              onKeyDown={(e) => e.key === "Enter" && addSlot()}
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="cute-button-secondary text-sm flex-1">取消</button>
            <button type="button" onClick={addSlot} className="cute-button-primary text-sm flex-1" disabled={!title.trim()}>确定</button>
          </div>
        </div>
      )}

      {/* Weekday slots */}
      {weekdaySlots.length > 0 && (
        <div className="mb-2">
          <div className="text-xs font-bold text-muted-foreground mb-1">周中</div>
          <div className="space-y-1">
            {weekdaySlots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)).map((slot) => (
              <div key={slot.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-border text-sm group">
                <span>{slot.emoji}</span>
                <span className="font-bold w-10">{DAY_NAMES[slot.dayOfWeek]}</span>
                <span className="text-muted-foreground">{slot.startTime}-{slot.endTime}</span>
                <span className="flex-1">{slot.title}</span>
                <button
                  type="button"
                  onClick={() => removeSlot(slot.id)}
                  className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekend slots */}
      {weekendSlots.length > 0 && (
        <div>
          <div className="text-xs font-bold text-muted-foreground mb-1">周末</div>
          <div className="space-y-1">
            {weekendSlots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)).map((slot) => (
              <div key={slot.id} className="flex items-center gap-2 bg-cute-yellow/10 rounded-xl px-3 py-2 border border-cute-yellow/30 text-sm group">
                <span>{slot.emoji}</span>
                <span className="font-bold w-10">{DAY_NAMES[slot.dayOfWeek]}</span>
                <span className="text-muted-foreground">{slot.startTime}-{slot.endTime}</span>
                <span className="flex-1">{slot.title}</span>
                <button
                  type="button"
                  onClick={() => removeSlot(slot.id)}
                  className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {slots.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-4">还没有添加固定时间</p>
      )}
    </div>
  );
}
