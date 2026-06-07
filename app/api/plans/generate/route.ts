import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getChild, setPlan, setDayTasks } from "@/lib/kv";
import { generateWeeklyPlan, generateStructuredPlan } from "@/lib/ai";
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

    // Validate based on mode
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
        // Build a readable description from structured data
        const slotCount = structured.fixedSlots.length;
        const wishCount = structured.wishlist.length;
        userDescription = `固定安排${slotCount}项 + 待办事项${wishCount}项`;
      }
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
      userDescription,
      status: "active" as const,
      createdAt: Date.now(),
    };

    await setPlan(plan);

    // Store each day's tasks
    const dayKeys = getWeekDays();
    for (const date of dayKeys) {
      const tasks = days[date] || [];
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
