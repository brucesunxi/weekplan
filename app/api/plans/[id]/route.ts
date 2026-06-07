import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlan, getChild } from "@/lib/kv";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const plan = await getPlan(id);
  if (!plan || plan.userId !== session.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  return NextResponse.json(plan);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const plan = await getPlan(id);
  if (!plan || plan.userId !== session.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const body = await req.json();
  const { updatePlan } = await import("@/lib/kv");
  await updatePlan(id, body);

  return NextResponse.json({ success: true });
}
