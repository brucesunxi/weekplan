"use client";

import { useState } from "react";
import type { FixedSlot, WishlistItem, StructuredInput } from "@/types";
import FixedSlotEditor from "./fixed-slot-editor";
import WishlistEditor from "./wishlist-editor";

interface Props {
  onSubmit: (data: StructuredInput) => void
  loading: boolean
}

export default function PlanFormStructured({ onSubmit, loading }: Props) {
  const [fixedSlots, setFixedSlots] = useState<FixedSlot[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [minPlayTime, setMinPlayTime] = useState("1小时");
  const [preferredPeriod, setPreferredPeriod] = useState("下午");
  const [additionalNotes, setAdditionalNotes] = useState("");

  function handleSubmit() {
    onSubmit({
      fixedSlots,
      wishlist,
      freeTimePreference: {
        minPlayTime,
        preferredPeriod,
      },
      additionalNotes,
    });
  }

  const hasContent = fixedSlots.length > 0 || wishlist.length > 0 || additionalNotes.trim();

  return (
    <div className="space-y-6">
      {/* Section 1: Fixed slots */}
      <div className="cute-card">
        <FixedSlotEditor slots={fixedSlots} onChange={setFixedSlots} />
      </div>

      {/* Section 2: Wishlist */}
      <div className="cute-card">
        <WishlistEditor items={wishlist} onChange={setWishlist} />
      </div>

      {/* Section 3: Free time + notes */}
      <div className="cute-card">
        <h3 className="font-bold flex items-center gap-1 mb-3">🎮 自由时间</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold mb-1 block">每天至少自由玩耍</label>
            <div className="flex gap-2">
              {["30分钟", "1小时", "1.5小时", "2小时"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMinPlayTime(t)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    minPlayTime === t
                      ? "bg-cute-sky text-white"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold mb-1 block">偏好时间段</label>
            <div className="flex gap-2">
              {["上午", "下午", "傍晚", "晚上"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreferredPeriod(p)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold transition-all ${
                    preferredPeriod === p
                      ? "bg-cute-yellow text-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Additional notes */}
      <div className="cute-card">
        <h3 className="font-bold flex items-center gap-1 mb-3">💬 补充说明</h3>
        <textarea
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="表格没覆盖到的信息可以在这里补充，比如：&#10;• 孩子注意力不太集中&#10;• 周三晚上有家庭聚餐&#10;• 这周是考试周"
          className="cute-input min-h-[100px] resize-y text-sm"
          rows={3}
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        className="cute-button-primary w-full"
        disabled={loading || !hasContent}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">✨</span> AI 正在生成...
          </span>
        ) : (
          "✨ 生成周计划"
        )}
      </button>
    </div>
  );
}
