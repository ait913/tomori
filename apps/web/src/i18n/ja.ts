export const ja = {
  appName: "tomori",
  disclosure: [
    "このアプリは Claude (Anthropic) を使って応答を生成します。",
    "送信内容は Anthropic 側で最大 30 日以内に削除され、学習には使われません。",
    "ただし送信前に氏名・電話番号・メールアドレスなど分かりやすい個人情報は自動で伏字に置換します。",
    "端末からサーバへの通信、サーバ DB の保存は暗号化されています。",
    "全データ削除は「設定 > 全データ削除」からいつでも実行できます。"
  ],
  moodTagsLabel: {
    work: "work",
    study: "study",
    social: "social",
    isolation: "isolation",
    exercise: "exercise",
    walk: "walk",
    sleep_well: "sleep_well",
    sleep_poor: "sleep_poor",
    food: "food",
    caffeine: "caffeine",
    alcohol: "alcohol",
    creative: "creative",
    reading: "reading",
    gaming: "gaming",
    family: "family",
    partner: "partner",
    friend: "friend",
    anxiety: "anxiety",
    focus_high: "focus_high",
    fatigue: "fatigue",
    morning_dialog: "morning_dialog",
    evening_dialog: "evening_dialog"
  }
} as const;
