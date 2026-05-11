export const CRISIS_PATTERNS_JA: { id: string; regex: RegExp }[] = [
  { id: "suicide_direct", regex: /(死にたい|消えたい|生きてる意味|もう生きていけない|自殺|首を吊|飛び降り|楽になりたい)/ },
  { id: "suicide_method", regex: /(練炭|オーバードーズ|\bod\b|大量服薬|電車に飛び込|手首を切|リスカ|アムカ)/ },
  { id: "self_harm", regex: /(リストカット|自傷|自分を傷つけ|刃物で.*自分)/ },
  { id: "harm_others", regex: /(殺してやる|殺したい|刺してやる|誰かを傷つけ)/ },
  { id: "abuse_victim", regex: /(殴られ|蹴られ|親に虐待|dv受け|性的に強要)/ }
];
