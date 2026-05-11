# Scenario: mood-quick-log (§7.14.3)

## Setup
- Login済

## Steps
1. Navigate to http://localhost:8080/mood
2. Click Likert "4"
3. Click chip "work"
4. Click "保存"

## Expect
- トースト `<div role="status">保存しました</div>` が一時表示される (2 秒以内)
- URL becomes http://localhost:8080/
