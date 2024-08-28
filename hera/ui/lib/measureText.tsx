import { isSafari } from '@deities/ui/Browser.tsx';
import { getCurrentFonts } from '../../i18n/getLocale.tsx';

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d')!;

export default function measure(
  text: string,
  containerWidth: number,
  { fontSize, letterSpacing } = {
    fontSize: 9,
    letterSpacing: 1,
  },
): ReadonlyArray<string> {
  if (!isSafari) {
    context.letterSpacing = `${letterSpacing}px`;
  }

  context.font = getCurrentFonts()
    .map((font) => `${fontSize}px ${font}`)
    .join(', ');

  const getLetterSpacing = (text: string) =>
    isSafari ? letterSpacing * (text.length - 1) : 0;

  const maxWidth = Math.max(80, containerWidth);
  const lines: Array<string> = [];
  const split = text.split(' ');
  let previousLine = '';
  let space = true;
  while (split.length) {
    const word = split[0];
    const nextLine = `${
      previousLine !== '' ? previousLine + (space ? ' ' : '') : ''
    }${word}`;
    space = true;
    const width =
      context.measureText(nextLine).width + getLetterSpacing(nextLine);
    if (width >= maxWidth) {
      // If the word itself is too long to fit on a single line, start splitting it at arbitrary points.
      const width = context.measureText(word).width + getLetterSpacing(word);
      if (width >= maxWidth) {
        space = false;
        split.shift();
        const splitPoint = word.length / 3;
        split.unshift(word.slice(0, splitPoint), word.slice(splitPoint));
        continue;
      }

      lines.push(previousLine);
      previousLine = '';
    } else {
      split.shift();
      previousLine = nextLine;
    }
  }

  if (previousLine !== '') {
    lines.push(previousLine);
  }

  return lines;
}
