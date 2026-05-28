/** Нормализует ввод: только 10 цифр после кода страны (латиница/кириллица-омографы не проходят) */
export function normalizePhoneDigits(input) {
  let d = String(input ?? '').replace(/[^0-9]/g, '');
  if (d.startsWith('7') || d.startsWith('8')) d = d.slice(1);
  return d.slice(0, 10);
}

/** Маска: +7 (988) 123-45-67 — незаполненное как подчёркивание */
export function formatPhoneMask(digits) {
  const d = normalizePhoneDigits(digits);
  const p = [
    d.slice(0, 3),
    d.slice(3, 6),
    d.slice(6, 8),
    d.slice(8, 10),
  ];
  const u = (s, n) => (s + '_'.repeat(n)).slice(0, n);

  return `+7 (${u(p[0], 3)}) ${u(p[1], 3)}-${u(p[2], 2)}-${u(p[3], 2)}`;
}

export function isPhoneComplete(digits) {
  return normalizePhoneDigits(digits).length === 10;
}

/** Разделяет маску на введённую часть и «скелет» */
export function splitPhoneMask(digits) {
  const full = formatPhoneMask(digits);
  let filledEnd = 0;
  for (let i = 0; i < full.length; i++) {
    if (full[i] === '_') {
      filledEnd = i;
      break;
    }
    filledEnd = i + 1;
  }
  return {
    filled: full.slice(0, filledEnd),
    skeleton: full.slice(filledEnd),
  };
}
