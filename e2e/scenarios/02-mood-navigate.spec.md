# Scenario: mood-navigate (§7.14.2)

## Setup
- Login済 (scenario 01 と同じ)

## Steps
1. Navigate to http://localhost:8080/
2. Click button "気分を記録"

## Expect
- URL becomes http://localhost:8080/mood
- Likert 5 つのボタン (1, 2, 3, 4, 5) が表示される
