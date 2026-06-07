import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getChild, setPlan, setDayTasks } from "@/lib/kv";
import { getWeekDays } from "@/lib/utils";
import type { Task } from "@/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { childId, days, description, style } = await req.json();

    if (!childId || !days) {
      return NextResponse.json({ error: "参数不完整" }, { status: 400 });
    }

    const child = await getChild(childId);
    if (!child || child.userId !== session.user.id) {
      return NextResponse.json({ error: "未找到孩子" }, { status: 404 });
    }

    const weekStart = getWeekDays(new Date())[0];
    const weekEnd = getWeekDays(new Date())[6];

    const planId = crypto.randomUUID();
    const plan = {
      id: planId,
      childId,
      userId: session.user.id,
      weekStart,
      weekEnd,
      userDescription: `${style}: ${description || ""}`,
      status: "active" as const,
      createdAt: Date.now(),
    };

    await setPlan(plan);

    const dayKeys = getWeekDays();
    for (const date of dayKeys) {
      const tasks: Task[] = days[date] || [];
      const cleanTasks = tasks.map((t: Task, i: number) => ({
        ...t,
        id: `${planId}-${date}-${i}`,
        completed: false,
      }));
      await setDayTasks(planId, date, cleanTasks);
    }

    return NextResponse.json({ planId, weekStart });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
