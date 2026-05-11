# Scenario: evening-close-summary (§7.14.7)

## Setup
- Login済、Evening session 開始済
- LLM mock で 5 ターン分の応答を仕込む。5 ターン目で `save_summary` tool を呼ぶレスポンスを mock

## Steps
1. 5 ターン分会話 (ユーザー側は短い相槌でOK)

## Expect
- 5 ターン目終了後、summary カード (sentiment_score / top_emotions / key_events 等が見える領域) が表示
- "保存" ボタン と "編集" ボタンが見える
