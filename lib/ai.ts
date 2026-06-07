import type { Task, StructuredInput } from "@/types";

const DEEPSEEK_API = "https://api.deepseek.com/chat/completions";

interface PlanCandidate {
  style: string
  description: string
  days: Record<string, Task[]>
}

export async function generateWeeklyPlan(
  description: string,
  childName: string,
  childAge: number,
  weekStart: string
): Promise<Record<string, Task[]>> {
  const dates = getDates(weekStart);
  const prompt = `为${childName}(${childAge}岁)做份${weekStart}起7天周计划。${description}
每天6-8项任务，含起床、三餐、学习、运动、玩乐、洗漱、睡觉。

仅返回极简JSON，每项{t(开始时间),e(结束时间),n(名称)}：{"${dates[0]}":[{"t":"07:00","e":"07:30","n":"起床洗漱"}]}`;

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

仅返回极简JSON，每项{t(开始时间),e(结束时间),n(名称)}：{"${getDates(weekStart)[0]}":[{"t":"07:00","e":"07:30","n":"起床洗漱"}]}`;

  return callDeepSeek(prompt, weekStart);
}

export async function generatePlanCandidates(
  description: string,
  childName: string,
  childAge: number,
  weekStart: string
): Promise<PlanCandidate[]> {
  const dates = getDates(weekStart);
  const prompt = `为${childName}(${childAge}岁)做份${weekStart}起7天周计划。${description}

请一次生成3种不同风格的方案，返回JSON数组。

方案1：⚖️ 劳逸结合（学习和玩乐均衡）
方案2：📚 学习优先（多安排学习）
方案3：🎮 轻松愉快（多户外和自由时间）

严格按此格式返回数组（每个方案一个对象）：
[{"style":"劳逸结合","description":"特点说明","days":{"${dates[0]}":[{"t":"07:00","e":"07:30","n":"起床洗漱"}]}}]

每天6-8项任务。不要markdown，只要纯JSON数组。`;

  const res = await fetch(DEEPSEEK_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      messages: [
        { role: "system", content: "你是儿童作息规划师。只返回JSON数组，不要markdown不要其他文字。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) throw new Error(`AI error: ${res.status}`);

  const data = await res.json();
  let content = data.choices?.[0]?.message?.content || "";
  if (!content) throw new Error("AI 返回为空");

  // Extract JSON array (handle markdown wrapping)
  const m = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (m) content = m[1];
  else { const b = content.match(/\[[\s\S]*\]/); if (b) content = b[0]; }

  // Try to fix truncated JSON (last item might be cut off)
  if (content.length > 1000 && !content.trim().endsWith("]")) {
    const lastBracket = content.lastIndexOf("}");
    if (lastBracket > 0) content = content.slice(0, lastBracket + 1) + "]";
  }

  let raw: Array<Record<string, unknown>>;
  try {
    raw = JSON.parse(content);
  } catch {
    content = content.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3').replace(/,\s*([}\]])/g, "$1");
    raw = JSON.parse(content);
  }

  if (!Array.isArray(raw)) throw new Error("AI 返回格式异常");

  return raw.map((candidate, idx) => {
    const style = (candidate.style || candidate.title || `方案${["A","B","C"][idx]}`) as string;
    const desc = (candidate.description || "") as string;
    const defaultStyle = ["⚖️ 劳逸结合", "📚 学习优先", "🎮 轻松愉快"][idx] || style;

    // Handle different response formats
    let rawDays: Record<string, unknown[]> = {};
    if (candidate.days && typeof candidate.days === "object") {
      rawDays = candidate.days as Record<string, unknown[]>;
    } else if (candidate.dailySchedule && Array.isArray(candidate.dailySchedule)) {
      // Convert dailySchedule array to days object
      for (const entry of candidate.dailySchedule as Array<Record<string, unknown>>) {
        const date = entry.date as string;
        const tasks = entry.tasks as unknown[];
        if (date && Array.isArray(tasks)) rawDays[date] = tasks;
      }
    }
    const normalized: Record<string, Task[]> = {};
    let idCounter = 0;

    for (const date of dates) {
      let items = rawDays[date];
      if (!Array.isArray(items)) {
        const alt = Object.keys(rawDays).find(k =>
          k.includes(date) || date.includes(k)
        );
        items = alt ? rawDays[alt] : [];
      }
      normalized[date] = (Array.isArray(items) ? items : []).map((t: unknown, i: number) => {
        const item = t as Record<string, string>;
        const tt = item.t || item.time || "08:00";
        const te = item.e || item.endTime || "";
        const name = item.n || item.title || item.name || "";
        return {
          id: String(idCounter + i),
          time: tt.includes("-") ? tt.split("-")[0].trim() : tt,
          endTime: te || (tt.includes("-") ? tt.split("-")[1]?.trim() || "" : ""),
          title: name,
          emoji: guessEmoji(name),
          category: guessCategory(name),
          completed: false,
        };
      });
      idCounter += normalized[date].length;
    }

    return { style: defaultStyle, description: desc, days: normalized };
  });
}

async function callDeepSeek(prompt: string, weekStart: string): Promise<Record<string, Task[]>> {
  const res = await fetch(DEEPSEEK_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
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

  // Debug log
  console.log("[AI RAW]", JSON.stringify(parsed).slice(0, 500));

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
  const [y, m, d] = start.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  for (let i = 0; i < 7; i++) {
    const ny = date.getFullYear();
    const nm = String(date.getMonth() + 1).padStart(2, "0");
    const nd = String(date.getDate()).padStart(2, "0");
    dates.push(`${ny}-${nm}-${nd}`);
    date.setDate(date.getDate() + 1);
  }
  return dates;
}
