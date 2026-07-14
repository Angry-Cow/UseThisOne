const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '*@#+%';
const ALL = LOWERCASE + UPPERCASE + NUMBERS + SYMBOLS;

export function generatePassword(length = 16): string {
  const arr: string[] = [];
  // Guarantee at least one from each character set
  arr.push(LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)]);
  arr.push(UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)]);
  arr.push(NUMBERS[Math.floor(Math.random() * NUMBERS.length)]);
  arr.push(SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
  // Fill the rest
  for (let i = arr.length; i < length; i++) {
    arr.push(ALL[Math.floor(Math.random() * ALL.length)]);
  }
  // Shuffle using Fisher-Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}
