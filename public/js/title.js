export function itemTitleFromText(text, maxWords = 7) {
  const firstLine = (text || '').split(/\r?\n/).find((l) => l.trim()) || '';
  const words = firstLine.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return 'Untitled';
  if (words.length <= maxWords) return words.join(' ');
  return `${words.slice(0, maxWords).join(' ')}…`;
}
