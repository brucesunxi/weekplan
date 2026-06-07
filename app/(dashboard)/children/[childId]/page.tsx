"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Child, Plan } from "@/types";
import { getWeekRange, getChineseWeekday, calculateProgress } from "@/lib/utils";

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [child, setChild] = useState<Child | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [childRes, plansRes] = await Promise.all([
          fetch(`/api/children/${params.childId}`),
          fetch(`/api/plans/list?childId=${params.childId}`),
        ]);
        if (childRes.ok) setChild(await childRes.json());
        if (plansRes.ok) setPlans(await plansRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.childId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-4xl animate-spin">🌟</div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">😢</div>
        <p>未找到孩子信息</p>
      </div>
    );
  }

  const { start: currentWeekStart } = getWeekRange();
  const hasActivePlan = plans.some((p) => p.status === "active");

  return (
    <div>
      {/* Child Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cute-card mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="text-5xl">{child.avatar}</div>
          <div className="flex-1">
            <h1 className="text-2xl font-black">{child.name}</h1>
            <p className="text-muted-foreground">{child.age}岁</p>
            {child.bio && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{child.bio}</p>
            )}
          </div>
          <Link
            href={`/children/${child.id}/plan/new`}
            className="cute-button-primary"
          >
            ✨ 生成新计划
          </Link>
        </div>
      </motion.div>

      {/* Plans List */}
      <h2 className="text-lg font-bold mb-4">历史计划</h2>

      {plans.length === 0 ? (
        <div className="cute-card text-center py-12">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-muted-foreground mb-4">还没有周计划，快去生成一个吧</p>
          <Link href={`/children/${child.id}/plan/new`} className="cute-button-primary">
            ✨ 生成周计划
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/children/${child.id}/plan/${plan.id}`}>
                <div className="cute-card flex items-center justify-between hover:border-primary-200 cursor-pointer">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">
                        {plan.weekStart} ~ {plan.weekEnd}
                      </span>
                      {plan.status === "active" && (
                        <span className="text-xs bg-cute-mint text-white px-2 py-0.5 rounded-full font-bold">
                          当前
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {plan.userDescription}
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
