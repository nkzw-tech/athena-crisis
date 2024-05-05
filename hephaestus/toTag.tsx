export default function toTag(text: string) {
  return text.replaceAll(/[^\da-z-]/gi, '').toLocaleLowerCase();
}
