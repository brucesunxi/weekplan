import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { hash } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "请填写用户名和密码" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    if (username.length < 2) {
      return NextResponse.json({ error: "用户名至少 2 个字符" }, { status: 400 });
    }

    const kv = new Redis({
      url: process.env.KV_REST_API_URL || "",
      token: process.env.KV_REST_API_TOKEN || "",
    });

    // Check if username exists
    const existing = await kv.hgetall(`user:${username}`);
    if (existing) {
      return NextResponse.json({ error: "该用户名已被注册" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const hashedPassword = await hash(password);

    // Store user by username
    await kv.hset(`user:${username}`, {
      id,
      password: hashedPassword,
      createdAt: Date.now(),
    });

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
