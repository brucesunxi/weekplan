import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getChild, setPlan, setDayTasks } from "@/lib/kv";
import { generateWeeklyPlan, generateStructuredPlan, generatePlanCandidates } from "@/lib/ai";
import { getWeekDays } from "@/lib/utils";
import type { Task, InputMode, StructuredInput } from "@/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { childId, mode } = body as { childId: string; mode: InputMode };

    if (!childId) {
      return NextResponse.json({ error: "请选择孩子" }, { status: 400 });
    }

    if (mode === "candidates") {
      return handleCandidates(body, session.user.id);
    }

    if (mode === "natural") {
      if (!body.description) {
        return NextResponse.json({ error: "请填写描述" }, { status: 400 });
      }
    } else if (mode === "structured") {
      if (!body.structured) {
        return NextResponse.json({ error: "请填写表格信息" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "无效的模式" }, { status: 400 });
    }

    const child = await getChild(childId);
    if (!child || child.userId !== session.user.id) {
      return NextResponse.json({ error: "未找到孩子" }, { status: 404 });
    }

    const weekStart = getWeekDays(new Date())[0];
    const weekEnd = getWeekDays(new Date())[6];

    let days: Record<string, Task[]>;
    let userDescription: string;

    try {
      if (mode === "natural") {
        days = await generateWeeklyPlan(body.description, child.name, child.age, weekStart);
        userDescription = body.description;
      } else {
        const structured = body.structured as StructuredInput;
        days = await generateStructuredPlan(structured, child.name, child.age, weekStart);
        userDescription = `固定安排${structured.fixedSlots.length}项 + 待办事项${structured.wishlist.length}项`;
      }
    } catch (err) {
      return handleAIError(err);
    }

    const dayKeys = getWeekDays();
    const hasTasks = dayKeys.some((date) => (days[date]?.length || 0) > 0);
    if (!hasTasks) {
      return NextResponse.json({ error: "AI 返回数据异常，请重试" }, { status: 502 });
    }

    const planId = crypto.randomUUID();
    const plan = {
      id: planId,
      childId,
      userId: session.user.id,
      weekStart,
      weekEnd,
      userDescription,
      status: "active" as const,
      createdAt: Date.now(),
    };

    await setPlan(plan);
    for (const date of dayKeys) {
      const tasks = days[date] || [];
      const cleanTasks = tasks.map((t, i) => ({
        ...t,
        id: `${planId}-${date}-${i}`,
        completed: false,
      }));
      await setDayTasks(planId, date, cleanTasks);
    }

    return NextResponse.json({ planId, weekStart, days });
  } catch (err) {
    console.error("Plan generation error:", err);
    return NextResponse.json({ error: "服务器错误，请重试" }, { status: 500 });
  }
}

async function handleCandidates(body: Record<string, unknown>, userId: string) {
  const childId = body.childId as string;
  const description = (body.description || "") as string;
  const child = await getChild(childId);
  if (!child || child.userId !== userId) {
    return NextResponse.json({ error: "未找到孩子" }, { status: 404 });
  }

  const weekStart = getWeekDays(new Date())[0];
  const weekEnd = getWeekDays(new Date())[6];

  let candidates;
  try {
    candidates = await generatePlanCandidates(description, child.name, child.age, weekStart);
  } catch (err) {
    return handleAIError(err);
  }

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ error: "AI 返回数据异常，请重试" }, { status: 502 });
  }

  // Return all candidates without saving
  return NextResponse.json({
    mode: "candidates",
    weekStart,
    weekEnd,
    candidates: candidates.map((c) => ({
      style: c.style,
      description: c.description,
      days: c.days,
      totalTasks: Object.values(c.days).reduce((sum, t) => sum + t.length, 0),
    })),
  });
}

function handleAIError(err: unknown) {
  const msg = err instanceof Error ? err.message : "";
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return NextResponse.json({ error: "AI 生成超时，请简化描述后重试" }, { status: 504 });
  }
  if (msg.includes("fetch")) {
    return NextResponse.json({ error: "AI 服务连接失败，请稍后重试" }, { status: 502 });
  }
  return NextResponse.json({ error: "AI 生成失败，请稍后重试" }, { status: 502 });
}
