import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlan, getDayTasks, updateTask, setDayTasks } from "@/lib/kv";
import { calculateProgress } from "@/lib/utils";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; date: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id, date } = await params;
  const plan = await getPlan(id);
  if (!plan || plan.userId !== session.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const tasks = await getDayTasks(id, date);
  return NextResponse.json({ tasks, progress: calculateProgress(tasks) });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; date: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id, date } = await params;
  const plan = await getPlan(id);
  if (!plan || plan.userId !== session.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const { taskId, completed } = await req.json();
  const tasks = await updateTask(id, date, taskId, completed);

  return NextResponse.json({
    success: true,
    dayProgress: calculateProgress(tasks),
  });
}

// PUT: replace all tasks for a day (used for editing)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; date: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id, date } = await params;
  const plan = await getPlan(id);
  if (!plan || plan.userId !== session.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const { tasks } = await req.json();
  if (!Array.isArray(tasks)) {
    return NextResponse.json({ error: "无效数据" }, { status: 400 });
  }

  await setDayTasks(id, date, tasks);
  return NextResponse.json({
    success: true,
    dayProgress: calculateProgress(tasks),
  });
}
