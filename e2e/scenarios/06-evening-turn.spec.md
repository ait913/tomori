# Scenario: evening-turn (§7.14.6)

## Setup
- Login済、Evening session 開始済

## Steps
1. テキストエリアに `'今日は何もしてない'` を入力
2. 送信ボタンクリック

## Expect
- 送信中: orb が `talking` state に変化 (data-state="talking" 属性 or class)
- 返答到着後: assistant 発話が新規吹き出しで表示
