import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getChild, deleteChild } from "@/lib/kv";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const child = await getChild(id);
  if (!child || child.userId !== session.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  return NextResponse.json(child);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { id } = await params;
  const child = await getChild(id);
  if (!child || child.userId !== session.user.id) {
    return NextResponse.json({ error: "未找到" }, { status: 404 });
  }

  await deleteChild(id, session.user.id);
  return NextResponse.json({ success: true });
}
