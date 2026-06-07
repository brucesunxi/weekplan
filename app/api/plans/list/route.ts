import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPlansByChild, getChild } from "@/lib/kv";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const childId = searchParams.get("childId");
  if (!childId) {
    return NextResponse.json({ error: "缺少 childId" }, { status: 400 });
  }

  const child = await getChild(childId);
  if (!child || child.userId !== session.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  const plans = await getPlansByChild(childId);
  return NextResponse.json(plans.sort((a, b) => b.createdAt - a.createdAt));
}
