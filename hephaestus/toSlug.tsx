export default function toSlug(text: string) {
  return text
    .replaceAll(/[^\da-z]/gi, ' ')
    .trim()
    .replaceAll(/(\s|-)+/gi, '-')
    .toLocaleLowerCase();
}
