import { readFileSync } from 'node:fs';
import terminalImage from 'term-img';
import type { Image } from './screenshot.tsx';

const CHUNK_SIZE = 4096;
const ESC = '\u001B';
const KITTY_IMAGE_SCALE = 2;
const TERMINAL_CELL_WIDTH = 16;

const supportsKittyGraphicsProtocol = () =>
  process.env.TERM_PROGRAM?.toLowerCase() === 'ghostty' ||
  process.env.TERM === 'xterm-kitty' ||
  process.env.TERM === 'xterm-ghostty' ||
  Boolean(process.env.GHOSTTY_RESOURCES_DIR);

const toBuffer = (image: Image) => (typeof image === 'string' ? readFileSync(image) : image);

const getPngWidth = (image: Buffer) =>
  image.length >= 24 && image.subarray(1, 4).toString() === 'PNG' ? image.readUInt32BE(16) : null;

const getScaledColumnCount = (image: Buffer) => {
  const width = getPngWidth(image);
  if (!width) {
    return '';
  }

  const columns = Math.ceil((width / TERMINAL_CELL_WIDTH) * KITTY_IMAGE_SCALE);
  return `c=${process.stdout.columns ? Math.min(columns, process.stdout.columns) : columns},`;
};

const toKittyGraphicsProtocol = (image: Image) => {
  const buffer = toBuffer(image);
  const data = buffer.toString('base64');
  let output = '';

  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + CHUNK_SIZE);
    const isFirstChunk = offset === 0;
    const isLastChunk = offset + CHUNK_SIZE >= data.length;
    const metadata = isFirstChunk ? `a=T,f=100,${getScaledColumnCount(buffer)}` : '';
    output += `${ESC}_G${metadata}m=${isLastChunk ? 0 : 1};${chunk}${ESC}\\`;
  }

  return output;
};

export default function renderTerminalImage(image: Image) {
  if (supportsKittyGraphicsProtocol()) {
    return toKittyGraphicsProtocol(image);
  }

  return terminalImage(image, { fallback: () => '' });
}
