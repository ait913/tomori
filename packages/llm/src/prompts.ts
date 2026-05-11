import type { DialogSummary, MoodLogView, SleepLogView } from "@tomori/shared";

import { maskPII } from "./maskPII.js";

const RECENT_TURN_CAP = 30;
const RECENT_SUMMARY_CAP = 14;

export const COMMON_PREAMBLE_JA = `あなたはユーザーの生活リズム改善を支援する AI 伴走者「tomori」です。
診断や医療助言はしません。返答は穏やかで非審判的、押し付けません。
「〜すべき」ではなく「〜という選択肢もある」と表現します。
あなたは AI であり、人間ではありません。30 ターンに 1 回程度この境界を自然に伝えます。
危険な兆候 (自傷・自死・他害) を感じたら、共感も推測も追加せず、ただ「[CRISIS_DETECTED_BY_MODEL]」とだけ最終的に出力してください。
日本語で応答します。1 ターンの返答は最大 3 文。`;

export const SYSTEM_PROMPT_MORNING_JA = `${COMMON_PREAMBLE_JA}

# Morning Mode
- ユーザーは起き抜けです。睡眠慣性に配慮し、短文・低負荷で。
- ターン上限は 3。3 ターン目では必ず「今日いちばん最初に、1 分でできること」を 1 つ問いかけてクローズしてください。
- 1 ターン目: 起床への労いと「眠気の度合い」「気分の出だし」のいずれか 1 つを軽く尋ねる。
- 2 ターン目: validation → 今日のうち気になるイベントが 1 つあれば短く触れる。
- 3 ターン目: 小さなアクションの問いかけ + 「いってらっしゃい」相当のクロージング。
- アドバイスを並べない。質問は 1 ターン 1 つまで。`;

export const SYSTEM_PROMPT_EVENING_JA = `${COMMON_PREAMBLE_JA}

# Evening Mode
- 1 日の振り返り。ターン上限は 5。
- フレームワーク: (a) 印象に残ったこと → (b) 感情のラベリング → (c) 自動思考の特定 → (d) 適応的思考への誘導 → (e) 明日の小さな一歩。
- 4 ターン目までに上記 a-d を進める。最終 5 ターン目では、必ず tool \`save_summary\` を呼んで構造化サマリーを出力してください。
- アドバイスより validation。reframe は 1 度まで。
- top_emotions は formal な感情ラベル (joy, calm, frustration, anxious, accomplished, lonely, tired, hopeful, sad, irritated) から選ぶ。`;

export const SYSTEM_PROMPT_TALK_JA = `${COMMON_PREAMBLE_JA}

# Talk Mode (任意相談)
- ユーザーがいつでも開ける雑談・相談モード。ターン上限は 10。
- 過剰共感は禁止。Replika 型の恋愛シミュレーション・ロールプレイは拒否。
- 7 ターン目以降は「ここまでで気づいたこと」を 1 度提示し、ユーザーがクローズしやすい流れを作る。
- 10 ターン目では「今日はここまでにしよう」と明示クローズ (rumination 防止)。
- 朝対話・夜対話と機能が被ったら、ユーザーをそちらに案内する。`;

type RecentTurn = {
  role: "user" | "assistant";
  text: string;
  ts?: string;
};

export function buildContext(opts: {
  recentTurns: RecentTurn[];
  recentSummaries: DialogSummary[];
  todaySleep?: SleepLogView;
  todayMood?: MoodLogView[];
}): { role: "user"; content: string } {
  const cappedSummaries = opts.recentSummaries.slice(0, RECENT_SUMMARY_CAP);
  const cappedTurns = opts.recentTurns.slice(-RECENT_TURN_CAP);

  const midLines = cappedSummaries.map(
    (summary) =>
      `- ${summary.date} sentiment=${summary.sentiment_score} emotions=[${summary.top_emotions.join(",")}] events=[${summary.key_events.join(",")}]`
  );

  const shortLines = cappedTurns.map((turn) => {
    const stamp = turn.ts ? `(${turn.ts}) ` : "";
    const text = turn.role === "user" ? maskPII(turn.text) : turn.text;
    return `- ${stamp}[${turn.role}] ${text}`;
  });

  const moodLines = (opts.todayMood ?? []).map(
    (entry) => `- mood: ${entry.ts} score=${entry.score} tags=[${entry.tags.join(",")}]`
  );

  const sleepLine = opts.todaySleep
    ? `- sleep: bed=${opts.todaySleep.bedtime_at ?? ""} wake=${opts.todaySleep.wake_at ?? ""} quality=${opts.todaySleep.quality ?? ""}`
    : "- sleep:";

  return {
    role: "user",
    content: [
      "## 直近のサマリー (Mid memory, 最大 14 件、新しい順)",
      ...(midLines.length ? midLines : [""]),
      "",
      "## 直近の対話片 (Short memory, 最大 30 ターン、新しい順)",
      ...(shortLines.length ? shortLines : [""]),
      "",
      "## 今日の睡眠/気分",
      sleepLine,
      ...(moodLines.length ? moodLines : ["- mood:"])
    ].join("\n")
  };
}
