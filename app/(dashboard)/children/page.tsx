"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Child } from "@/types";

export default function ChildrenPage() {
  const { data: session } = useSession();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/children");
        if (res.ok) {
          const data = await res.json();
          setChildren(data);
        }
      } catch (err) {
        console.error("Failed to load children", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-4xl animate-spin">🌟</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black">我的孩子</h1>
          <p className="text-sm text-muted-foreground mt-1">管理孩子的周计划和每日打卡</p>
        </div>
        <Link href="/children/new" className="cute-button-primary">
          ➕ 添加孩子
        </Link>
      </div>

      {children.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cute-card text-center py-16"
        >
          <div className="text-6xl mb-4">👶</div>
          <h2 className="text-xl font-bold mb-2">还没有添加孩子</h2>
          <p className="text-muted-foreground mb-6">先添加孩子，然后 AI 会帮你生成周计划</p>
          <Link href="/children/new" className="cute-button-primary">
            ➕ 添加第一个孩子
          </Link>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {children.map((child, i) => (
            <motion.div
              key={child.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/children/${child.id}`}>
                <div className="cute-card flex items-center gap-4 hover:border-primary-200 cursor-pointer transition-all">
                  <div className="text-4xl">{child.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg">{child.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {child.age}岁 {child.bio ? `· ${child.bio.slice(0, 30)}...` : ""}
                    </p>
                  </div>
                  <div className="text-muted-foreground">→</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
