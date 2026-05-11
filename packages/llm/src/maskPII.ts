const EMAIL_REGEX = /(?<!\[EMAIL\])[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const TEL_REGEX = /\b0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{4}\b/g;
const CC_CANDIDATE_REGEX = /\b(?:\d[ -]?){13,19}\d\b/g;

function luhn(value: string): boolean {
  let sum = 0;
  let shouldDouble = false;

  for (let index = value.length - 1; index >= 0; index -= 1) {
    const digit = Number(value[index]);
    if (Number.isNaN(digit)) {
      return false;
    }
    let next = digit;
    if (shouldDouble) {
      next *= 2;
      if (next > 9) {
        next -= 9;
      }
    }
    sum += next;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function maskPII(text: string | null | undefined): string {
  if (!text) {
    return "";
  }

  let masked = text.replace(EMAIL_REGEX, "[EMAIL]");
  masked = masked.replace(TEL_REGEX, "[TEL]");
  masked = masked.replace(CC_CANDIDATE_REGEX, (candidate) => {
    const normalized = candidate.replace(/[ -]/g, "");
    if (normalized.length < 13 || normalized.length > 19) {
      return candidate;
    }
    return luhn(normalized) ? "[CC]" : candidate;
  });

  return masked;
}
