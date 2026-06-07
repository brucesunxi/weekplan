import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getChild, setPlan, setDayTasks } from "@/lib/kv";
import { generateWeeklyPlan } from "@/lib/ai";
import { getWeekDays } from "@/lib/utils";
import type { Task } from "@/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { childId, description } = await req.json();
    if (!childId || !description) {
      return NextResponse.json({ error: "请填写描述" }, { status: 400 });
    }

    const child = await getChild(childId);
    if (!child || child.userId !== session.user.id) {
      return NextResponse.json({ error: "未找到孩子" }, { status: 404 });
    }

    // Generate plan with AI
    const weekStart = getWeekDays(new Date())[0];
    const weekEnd = getWeekDays(new Date())[6];

    let days: Record<string, Task[]>;
    try {
      days = await generateWeeklyPlan(
        description,
        child.name,
        child.age,
        weekStart
      );
    } catch (err) {
      return NextResponse.json(
        { error: "AI 生成失败，请稍后重试" },
        { status: 502 }
      );
    }

    // Create plan record
    const planId = crypto.randomUUID();
    const plan = {
      id: planId,
      childId,
      userId: session.user.id,
      weekStart,
      weekEnd,
      userDescription: description,
      status: "active" as const,
      createdAt: Date.now(),
    };

    await setPlan(plan);

    // Store each day's tasks
    const dayKeys = getWeekDays();
    for (const date of dayKeys) {
      const tasks = days[date] || [];
      // Assign stable IDs and set completed to false
      const cleanTasks = tasks.map((t, i) => ({
        ...t,
        id: `${planId}-${date}-${i}`,
        completed: false,
      }));
      await setDayTasks(planId, date, cleanTasks);
    }

    return NextResponse.json({
      planId,
      weekStart,
      days,
    });
  } catch (err) {
    console.error("Plan generation error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
