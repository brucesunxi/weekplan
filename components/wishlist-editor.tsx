"use client";

import { useState } from "react";
import type { WishlistItem, WishlistCategory, WishlistFrequency, WishlistPriority } from "@/types";
import { WISHLIST_CATEGORY_META, WISHLIST_FREQUENCY_META, WISHLIST_PRIORITY_META } from "@/types";

interface Props {
  items: WishlistItem[]
  onChange: (items: WishlistItem[]) => void
}

const CATEGORIES: WishlistCategory[] = ["reading", "tutoring", "practice", "homework", "habit", "chore", "play"];
const FREQUENCIES: WishlistFrequency[] = ["daily", "weekdays", "weekends", "weekly"];
const PRIORITIES: WishlistPriority[] = ["high", "medium", "low"];

export default function WishlistEditor({ items, onChange }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState<WishlistCategory>("reading");
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<WishlistFrequency>("daily");
  const [duration, setDuration] = useState("30分钟");
  const [priority, setPriority] = useState<WishlistPriority>("medium");

  function addItem() {
    if (!title.trim()) return;
    const newItem: WishlistItem = {
      id: crypto.randomUUID(),
      category,
      title: title.trim(),
      frequency,
      duration,
      priority,
    };
    onChange([...items, newItem]);
    setTitle("");
    setShowForm(false);
  }

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id));
  }

  // Group items by category
  const grouped = CATEGORIES.map((cat) => ({
    cat,
    meta: WISHLIST_CATEGORY_META[cat],
    items: items.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-1">⭐ 希望坚持的事项</h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="text-sm bg-primary-100 text-primary-700 px-3 py-1.5 rounded-xl font-bold hover:bg-primary-200 transition-colors"
        >
          ＋ 添加
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-3">希望孩子坚持做的事，AI 会合理安排到空闲时间</p>

      {/* Add form */}
      {showForm && (
        <div className="bg-muted rounded-2xl p-4 mb-3 space-y-3">
          <div>
            <label className="text-xs font-bold mb-1 block">事项名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="如：每天阅读、练字、整理书包"
              className="cute-input text-sm"
              onKeyDown={(e) => e.key === "Enter" && addItem()}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold mb-1 block">分类</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as WishlistCategory)} className="cute-input text-sm">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{WISHLIST_CATEGORY_META[c].emoji} {WISHLIST_CATEGORY_META[c].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">频率</label>
              <select value={frequency} onChange={(e) => setFrequency(e.target.value as WishlistFrequency)} className="cute-input text-sm">
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>{WISHLIST_FREQUENCY_META[f].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">时长</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="如：30分钟"
                className="cute-input text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold mb-1 block">优先级</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as WishlistPriority)} className="cute-input text-sm">
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{WISHLIST_PRIORITY_META[p].label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="cute-button-secondary text-sm flex-1">取消</button>
            <button type="button" onClick={addItem} className="cute-button-primary text-sm flex-1" disabled={!title.trim()}>确定</button>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 && !showForm && (
        <p className="text-xs text-muted-foreground text-center py-4">还没有添加事项</p>
      )}

      {grouped.map((g) => (
        <div key={g.cat} className="mb-2">
          <div className="text-xs font-bold text-muted-foreground mb-1">{g.meta.emoji} {g.meta.label}</div>
          <div className="space-y-1">
            {g.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-border text-sm group">
                <span className="flex-1 font-medium">{item.title}</span>
                <span className="text-xs text-muted-foreground">{WISHLIST_FREQUENCY_META[item.frequency].label}</span>
                <span className="text-xs text-muted-foreground">{item.duration}</span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded font-bold"
                  style={{
                    backgroundColor: WISHLIST_PRIORITY_META[item.priority].color + "30",
                    color: WISHLIST_PRIORITY_META[item.priority].color,
                  }}
                >
                  {WISHLIST_PRIORITY_META[item.priority].label}
                </span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
