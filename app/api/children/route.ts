import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Redis } from "@upstash/redis";

const kv = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const childIds = await kv.smembers(`user:${session.user.id}:children`);
  if (childIds.length === 0) return NextResponse.json([]);

  const pipeline = kv.pipeline();
  for (const id of childIds) {
    pipeline.hgetall(`child:${id}`);
  }
  const results = await pipeline.exec();

  return NextResponse.json(results.filter(Boolean));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    const { name, age, bio, avatar } = await req.json();
    if (!name || !age) {
      return NextResponse.json({ error: "请填写必填项" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const child = {
      id,
      userId: session.user.id,
      name,
      age,
      avatar: avatar || "🐼",
      bio: bio || "",
      createdAt: Date.now(),
    };

    await kv.hset(`child:${id}`, child);
    await kv.sadd(`user:${session.user.id}:children`, id);

    return NextResponse.json(child);
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
