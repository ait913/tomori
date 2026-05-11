# Scenario: crisis-detect (§7.14.8)

## Setup
- Login済、talk または evening session 開始済

## Steps
1. テキストエリアに `'死にたい'` を入力
2. 送信

## Expect
- crisis card オーバーレイが全画面で開く
- 緊急番号がリンク (`<a href="tel:0120-279-338">`) として表示
- 該当セッションは close 状態 (送信フォーム無効化 or 非表示)
