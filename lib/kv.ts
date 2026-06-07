import { Redis } from "@upstash/redis";
import type { Child, Plan, Task } from "@/types";

const kv = new Redis({
  url: process.env.KV_REST_API_URL || "",
  token: process.env.KV_REST_API_TOKEN || "",
});

// ===== Keys =====
const keys = {
  user: (id: string) => `user:${id}`,
  child: (id: string) => `child:${id}`,
  userChildren: (userId: string) => `user:${userId}:children`,
  plan: (id: string) => `plan:${id}`,
  childPlans: (childId: string) => `child:${childId}:plans`,
  dayTasks: (planId: string, date: string) => `plan:${planId}:day:${date}`,
};

// ===== Children =====
export async function getChild(id: string): Promise<Child | null> {
  return kv.hgetall(keys.child(id)) as Promise<Child | null>;
}

export async function setChild(child: Child): Promise<void> {
  await kv.hset(keys.child(child.id), child as unknown as Record<string, unknown>);
  await kv.sadd(keys.userChildren(child.userId), child.id);
}

export async function updateChild(id: string, data: Partial<Child>): Promise<void> {
  await kv.hset(keys.child(id), data as unknown as Record<string, unknown>);
}

export async function deleteChild(id: string, userId: string): Promise<void> {
  await kv.del(keys.child(id));
  await kv.srem(keys.userChildren(userId), id);
}

export async function getChildrenByUser(userId: string): Promise<Child[]> {
  const ids = await kv.smembers(keys.userChildren(userId));
  if (ids.length === 0) return [];
  const pipeline = kv.pipeline();
  for (const id of ids) {
    pipeline.hgetall(keys.child(id));
  }
  const results = await pipeline.exec();
  return results.filter(Boolean) as Child[];
}

// ===== Plans =====
export async function getPlan(id: string): Promise<Plan | null> {
  return kv.hgetall(keys.plan(id)) as Promise<Plan | null>;
}

export async function setPlan(plan: Plan): Promise<void> {
  await kv.hset(keys.plan(plan.id), plan as unknown as Record<string, unknown>);
  await kv.sadd(keys.childPlans(plan.childId), plan.id);
}

export async function updatePlan(id: string, data: Partial<Plan>): Promise<void> {
  await kv.hset(keys.plan(id), data as unknown as Record<string, unknown>);
}

export async function getPlansByChild(childId: string): Promise<Plan[]> {
  const ids = await kv.smembers(keys.childPlans(childId));
  if (ids.length === 0) return [];
  const pipeline = kv.pipeline();
  for (const id of ids) {
    pipeline.hgetall(keys.plan(id));
  }
  const results = await pipeline.exec();
  return results.filter(Boolean) as Plan[];
}

// ===== Daily Tasks =====
export async function getDayTasks(planId: string, date: string): Promise<Task[]> {
  const raw = await kv.get<string>(keys.dayTasks(planId, date));
  return raw ? JSON.parse(raw) : [];
}

export async function setDayTasks(planId: string, date: string, tasks: Task[]): Promise<void> {
  await kv.set(keys.dayTasks(planId, date), JSON.stringify(tasks));
}

export async function updateTask(
  planId: string,
  date: string,
  taskId: string,
  completed: boolean
): Promise<Task[]> {
  const tasks = await getDayTasks(planId, date);
  const updated = tasks.map((t) =>
    t.id === taskId
      ? { ...t, completed, completedAt: completed ? Date.now() : undefined }
      : t
  );
  await setDayTasks(planId, date, updated);
  return updated;
}
