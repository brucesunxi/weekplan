import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { hash } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "请填写所有必填项" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
    }

    const kv = new Redis({
      url: process.env.KV_REST_API_URL || "",
      token: process.env.KV_REST_API_TOKEN || "",
    });

    // Check if email exists
    const existing = await kv.hgetall(`user:email:${email}`);
    if (existing) {
      return NextResponse.json({ error: "该邮箱已注册" }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const hashedPassword = await hash(password);

    // Store user
    await kv.hset(`user:${id}`, {
      id,
      name,
      email,
      createdAt: Date.now(),
    });

    // Store email index
    await kv.hset(`user:email:${email}`, {
      id,
      name,
      email,
      password: hashedPassword,
    });

    return NextResponse.json({ success: true, id });
  } catch {
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
