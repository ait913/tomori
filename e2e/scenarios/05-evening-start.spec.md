# Scenario: evening-start (§7.14.5)

## Setup
- Login済
- LLM mock or real key

## Steps
1. Navigate to http://localhost:8080/evening
2. Click button "振り返る" (without changing picker)

## Expect
- 対話 UI が起動
- 最初の assistant 発話 (吹き出し) が画面に表示される
