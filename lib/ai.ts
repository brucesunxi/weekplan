import type { Task, StructuredInput } from "@/types";
import { DAY_NAMES } from "@/types";

const DEEPSEEK_API = "https://api.deepseek.com/v1/chat/completions";

export async function generateWeeklyPlan(
  description: string,
  childName: string,
  childAge: number,
  weekStart: string
): Promise<Record<string, Task[]>> {
  const prompt = buildNaturalPrompt(description, childName, childAge, weekStart);
  return callDeepSeek(prompt, weekStart);
}

export async function generateStructuredPlan(
  input: StructuredInput,
  childName: string,
  childAge: number,
  weekStart: string
): Promise<Record<string, Task[]>> {
  const prompt = buildStructuredPrompt(input, childName, childAge, weekStart);
  return callDeepSeek(prompt, weekStart);
}

async function callDeepSeek(prompt: string, weekStart: string): Promise<Record<string, Task[]>> {
  const res = await fetch(DEEPSEEK_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: "你是一个专业的儿童作息规划师。你擅长根据孩子的年龄和日常安排，制定科学合理的周计划。请严格按照 JSON 格式返回数据，不要包含其他内容。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`DeepSeek API error: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 返回为空");

  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/{[\s\S]*}/);
  const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

  try {
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch {
    const cleaned = jsonStr.replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  }
}

function getDateStr(start: string, days: number): string {
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ===== Natural language prompt =====
function buildNaturalPrompt(description: string, childName: string, childAge: number, weekStart: string): string {
  return `请为 ${childName}（${childAge}岁）制定一份 ${weekStart} 开始的周计划。

孩子的描述：
${description}

要求：
1. 按周一到周日（共7天）分别安排
2. 每天包含 8-15 个任务，涵盖起床、三餐、学习、运动、玩乐、洗漱、睡觉等
3. 时间安排要合理，不要太紧也不要太松
4. 结合孩子的年龄特点，${childAge}岁孩子需要注意劳逸结合

请严格按照以下 JSON 格式返回（不要添加任何额外说明）：

{
  "${weekStart}": [
    { "id": "1", "time": "07:00", "endTime": "07:30", "title": "起床洗漱", "emoji": "🛏️", "category": "sleep", "completed": false },
    { "id": "2", "time": "07:30", "endTime": "08:00", "title": "早餐时间", "emoji": "🍚", "category": "meal", "completed": false }
  ],
  ...
}

注意事项：
- id 为当天唯一标识，从1开始编号
- time 和 endTime 格式为 HH:mm
- category 只能为 "study" | "play" | "meal" | "sleep" | "sport" | "other"
- emoji 选择与任务内容相关的 emoji
- completed 固定为 false
- 每天的第一个任务不早于 06:00，最后一个任务不晚于 22:00
- 每两个任务之间留出合理的过渡时间
- 保证每天有足够的户外活动和自由玩耍时间`;
}

// ===== Structured prompt =====
function buildStructuredPrompt(input: StructuredInput, childName: string, childAge: number, weekStart: string): string {
  // Build fixed schedule section
  let fixedScheduleText = "";
  if (input.fixedSlots.length > 0) {
    const byDay: Record<number, { title: string; time: string }[]> = {};
    for (const slot of input.fixedSlots) {
      for (const d of slot.days) {
        if (!byDay[d]) byDay[d] = [];
        byDay[d].push({
          title: `${slot.emoji} ${slot.title}`,
          time: `${slot.startTime}-${slot.endTime}`,
        });
      }
    }
    fixedScheduleText = "\n【固定时间安排】\n以下时间段已被占用，请在这些时间安排对应的活动，不要冲突：\n";
    for (let d = 1; d <= 5; d++) {
      const slots = byDay[d];
      if (slots) {
        fixedScheduleText += `${DAY_NAMES[d]}: ${slots.map((s) => `${s.time} ${s.title}`).join("、")}\n`;
      }
    }
    if (byDay[0] || byDay[6]) {
      const weekendSlots = [...(byDay[6] || []), ...(byDay[0] || [])];
      if (weekendSlots.length > 0) {
        fixedScheduleText += `周末: ${weekendSlots.map((s) => `${s.time} ${s.title}`).join("、")}\n`;
      }
    }
  }

  // Build wishlist section
  let wishlistText = "";
  if (input.wishlist.length > 0) {
    wishlistText = "\n【希望坚持的事项】\n请将这些事项合理安排到空闲时间段中（高优先级尽量每天安排）：\n";
    const byPriority = { high: input.wishlist.filter((i) => i.priority === "high"), medium: input.wishlist.filter((i) => i.priority === "medium"), low: input.wishlist.filter((i) => i.priority === "low") };

    if (byPriority.high.length > 0) {
      wishlistText += "\n🔴 高优先级（尽量每天安排）：\n";
      for (const item of byPriority.high) {
        wishlistText += `  - ${item.title}（${item.frequency === "daily" ? "每天" : item.frequency === "weekdays" ? "周中每天" : item.frequency === "weekends" ? "周末" : "每周"}，${item.duration}）\n`;
      }
    }
    if (byPriority.medium.length > 0) {
      wishlistText += "\n🟡 中优先级（隔天或按频率安排）：\n";
      for (const item of byPriority.medium) {
        wishlistText += `  - ${item.title}（${item.frequency === "daily" ? "每天" : item.frequency === "weekdays" ? "周中每天" : item.frequency === "weekends" ? "周末" : "每周"}，${item.duration}）\n`;
      }
    }
    if (byPriority.low.length > 0) {
      wishlistText += "\n🟢 低优先级（有空再安排）：\n";
      for (const item of byPriority.low) {
        wishlistText += `  - ${item.title}（${item.frequency === "daily" ? "每天" : item.frequency === "weekdays" ? "周中每天" : item.frequency === "weekends" ? "周末" : "每周"}，${item.duration}）\n`;
      }
    }
  }

  // Free time
  const freeTimeText = `\n【自由时间要求】\n每天至少保留 ${input.freeTimePreference.minPlayTime} 的自由玩耍时间，优先安排在${input.freeTimePreference.preferredPeriod}。`;

  // Wake & Bed time
  const routineText = `\n【作息边界】\n每天 ${input.wakeTime} 起床，${input.bedTime} 睡觉。请严格按照这个时间安排每天的第一个和最后一个任务。`;

  // Additional notes
  const notesText = input.additionalNotes ? `\n【补充说明】\n${input.additionalNotes}` : "";

  return `请为 ${childName}（${childAge}岁）制定一份 ${weekStart} 开始的周计划。

${fixedScheduleText}${wishlistText}${freeTimeText}${routineText}${notesText}

要求：
1. 按周一到周日（共7天）分别安排
2. 每天包含 8-15 个任务，涵盖起床、三餐、学习、运动、玩乐、洗漱、睡觉等
3. 时间安排要合理，固定时间段的安排必须精准匹配
4. 把"希望坚持的事项"科学地插入到固定时间之间的空隙中，高优先级优先安排
5. ${childAge}岁孩子需要注意劳逸结合

请严格按照以下 JSON 格式返回（不要添加任何额外说明）：

{
  "${weekStart}": [
    { "id": "1", "time": "07:00", "endTime": "07:30", "title": "起床洗漱", "emoji": "🛏️", "category": "sleep", "completed": false },
    ...
  ],
  "${getDateStr(weekStart, 1)}": [...],
  "${getDateStr(weekStart, 2)}": [...],
  "${getDateStr(weekStart, 3)}": [...],
  "${getDateStr(weekStart, 4)}": [...],
  "${getDateStr(weekStart, 5)}": [...],
  "${getDateStr(weekStart, 6)}": [...]
}

注意事项：
- id 为当天唯一标识，从1开始编号
- time 和 endTime 格式为 HH:mm
- category 只能为 "study" | "play" | "meal" | "sleep" | "sport" | "other"
- 固定时间段的 time/endTime 必须与给定的完全一致
- emoji 选择与任务内容相关的 emoji
- completed 固定为 false
- 每天的第一个任务不早于 06:00，最后一个任务不晚于 22:00`;
}
