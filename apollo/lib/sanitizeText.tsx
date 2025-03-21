export default function sanitizeText(text: string) {
  return text
    .replaceAll(/[\u2018\u2019]/g, `'`)
    .replaceAll(/[\u201C\u201D]/g, `"`)
    .replaceAll(/[\s\u200B\u200C\u2060]/g, ' ')
    .replaceAll(
      // eslint-disable-next-line no-misleading-character-class
      /[\u0300-\u036F\u1AB0-\u1AFF\u1DC0-\u1DFF\u20D0-\u20FF\uFE20-\uFE2F]{5,}/g,
      '',
    )
    .trim();
}
