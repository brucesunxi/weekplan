import type { Task } from "@/types";

const DEEPSEEK_API = "https://api.deepseek.com/v1/chat/completions";

export async function generateWeeklyPlan(
  description: string,
  childName: string,
  childAge: number,
  weekStart: string
): Promise<Record<string, Task[]>> {
  const prompt = buildPrompt(description, childName, childAge, weekStart);

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
          content:
            "你是一个专业的儿童作息规划师。你擅长根据孩子的年龄和日常安排，制定科学合理的周计划。请严格按照 JSON 格式返回数据，不要包含其他内容。",
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

  // Parse JSON from response
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/{[\s\S]*}/);
  const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;

  try {
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch {
    // Try cleaning
    const cleaned = jsonStr.replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  }
}

function buildPrompt(
  description: string,
  childName: string,
  childAge: number,
  weekStart: string
): string {
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
  "${getNextDate(weekStart, 1)}": [...],
  ...
}

注意事项：
- id 为当天唯一标识，从1开始编号
- time 和 endTime 格式为 HH:mm
- category 只能为 "study" | "play" | "meal" | "sleep" | "sport" | "other"
- emoji 选择与任务内容相关的 emoji
- title 简洁明了，适合孩子阅读
- completed 固定为 false
- 每天的第一个任务不早于 06:00，最后一个任务不晚于 22:00
- 每两个任务之间留出合理的过渡时间
- 保证每天有足够的户外活动和自由玩耍时间`;
}

function getNextDate(start: string, days: number): string {
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
