# Scenario: account-delete (§7.14.10)

## Setup
- Login済

## Steps
1. Navigate to http://localhost:8080/settings
2. Click "全データ削除" ボタン
3. confirm dialog で `DELETE` を入力
4. 確定

## Expect
- /api/account/delete が 200 を返す
- /login へリダイレクト
- /api/me が 401 を返す (session revoked)
