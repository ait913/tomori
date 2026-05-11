# Scenario: dark-mode-toggle (§7.14.9)

## Setup
- Login済

## Steps
1. Navigate to http://localhost:8080/settings
2. ダークモードトグルをクリック

## Expect
- JavaScript で `document.documentElement.classList.contains('dark') === true`
- 背景色が `#1B1814` (tomori.bg.dark) に変わる (computed style 比較)
