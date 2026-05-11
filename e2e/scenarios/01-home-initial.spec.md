# Scenario: home-initial (§7.14.1)

## Setup
- Login as touri1705@outlook.com (magic link を DB に事前投入し /api/auth/magic/verify を叩く)

## Steps
1. Navigate to http://localhost:8080/

## Expect
- `<img alt="tomori orb">` が存在する
- 4 つの CTA カードボタンが存在する: "朝の対話" / "夜の対話" / "気分を記録" / "AI に相談"
