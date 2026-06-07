import type { Task, StructuredInput } from "@/types";

const DEEPSEEK_API = "https://api.deepseek.com/chat/completions";

export async function generateWeeklyPlan(
  description: string,
  childName: string,
  childAge: number,
  weekStart: string
): Promise<Record<string, Task[]>> {
  const prompt = `为${childName}(${childAge}岁)做份${weekStart}起7天周计划。${description}
每天6-8项任务，含起床、三餐、学习、运动、玩乐、洗漱、睡觉。

仅返回极简JSON，每项{t(开始时间),e(结束时间),n(名称)}：{"${weekStart}":[{"t":"07:00","e":"07:30","n":"起床洗漱"}]}`;

  return callDeepSeek(prompt, weekStart);
}

export async function generateStructuredPlan(
  input: StructuredInput,
  childName: string,
  childAge: number,
  weekStart: string
): Promise<Record<string, Task[]>> {
  let extra = "";
  if (input.fixedSlots.length > 0) {
    const byDay: Record<number, string[]> = {};
    for (const s of input.fixedSlots) {
      for (const d of s.days) {
        if (!byDay[d]) byDay[d] = [];
        byDay[d].push(`${s.startTime}-${s.endTime} ${s.emoji}${s.title}`);
      }
    }
    extra += "固定时间：";
    for (let d = 1; d <= 5; d++) if (byDay[d]) extra += `周${"一二三四五"[d-1]}:${byDay[d].join("、")} `;
    if (byDay[0] || byDay[6]) extra += `周末:${[...(byDay[6]||[]), ...(byDay[0]||[])].join("、")}`;
  }
  if (input.wishlist.length > 0) {
    extra += " 待办：" + input.wishlist.map(i => `${i.title}(${i.duration})`).join("、");
  }
  extra += ` ${input.wakeTime}起床-${input.bedTime}睡觉`;
  if (input.freeTimePreference.minPlayTime) extra += ` 至少${input.freeTimePreference.minPlayTime}自由时间`;
  if (input.additionalNotes) extra += ` ${input.additionalNotes}`;

  const prompt = `为${childName}(${childAge}岁)做份${weekStart}起7天周计划。${extra}
固定时间必须精确匹配。每天6-8项任务。

仅返回极简JSON，每项{t(开始时间),e(结束时间),n(名称)}：{"${weekStart}":[{"t":"07:00","e":"07:30","n":"起床洗漱"}]}`;

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
        { role: "system", content: "你是儿童作息规划师。只返回JSON，不要任何其他文字。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 2500,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI error: ${res.status}`);
  }

  const data = await res.json();
  let content = data.choices?.[0]?.message?.content || "";
  if (!content) throw new Error("AI 返回为空");

  // Extract JSON
  const m = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) content = m[1];
  else { const b = content.match(/{[\s\S]*}/); if (b) content = b[0]; }

  // Parse with recovery
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    content = content.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');
    content = content.replace(/,\s*([}\]])/g, "$1");
    parsed = JSON.parse(content);
  }

  // Normalize
  const dates = getDates(weekStart);
  const result: Record<string, Task[]> = {};
  let idCounter = 0;

  for (const date of dates) {
    let items = parsed[date];
    if (!Array.isArray(items)) {
      const alt = Object.keys(parsed).find(k =>
        k.includes(date) || date.includes(k) ||
        parseInt(k.split("-")[2]) === parseInt(date.split("-")[2])
      );
      items = alt ? parsed[alt] : [];
    }
    result[date] = (Array.isArray(items) ? items : []).map((t: unknown, i: number) => {
      const item = t as Record<string, string>;
      const tStart = item.t || item.time || "08:00";
      const tEnd = item.e || item.endTime || "";
      const name = item.n || item.title || item.name || "";
      return {
        id: String(idCounter + i),
        time: tStart.includes("-") ? tStart.split("-")[0].trim() : tStart,
        endTime: tEnd || (tStart.includes("-") ? tStart.split("-")[1]?.trim() || "" : ""),
        title: name,
        emoji: guessEmoji(name),
        category: guessCategory(name),
        completed: false,
      };
    });
    idCounter += result[date].length;
  }

  return result;
}

function guessEmoji(t: string): string {
  if (/起床|洗漱|洗/.test(t)) return "🛏️";
  if (/早[餐饭]|午[餐饭]|晚[餐饭]|吃|饭|喝|点心/.test(t)) return "🍚";
  if (/学习|作业|上课|课|读|写|练/.test(t)) return "📚";
  if (/运动|户外|跑|跳|球|游泳|骑车/.test(t)) return "⚽";
  if (/玩|自由|游戏|电视/.test(t)) return "🎮";
  if (/睡|休息|午睡/.test(t)) return "😴";
  if (/读|书|绘本/.test(t)) return "📖";
  if (/画|手工|艺术|钢琴|音乐/.test(t)) return "🎨";
  return "✅";
}

function guessCategory(t: string): Task["category"] {
  if (/起床|洗漱|睡|休息|午睡/.test(t)) return "sleep";
  if (/早[餐饭]|午[餐饭]|晚[餐饭]|吃|饭|喝|点心/.test(t)) return "meal";
  if (/学习|作业|上课|课|读|写|练|钢琴/.test(t)) return "study";
  if (/运动|户外|跑|跳|球|游泳|骑车/.test(t)) return "sport";
  if (/玩|自由|游戏|动画|电视/.test(t)) return "play";
  return "other";
}

function getDates(start: string): string[] {
  const dates: string[] = [];
  const d = new Date(start);
  for (let i = 0; i < 7; i++) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}
