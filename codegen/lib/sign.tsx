import { createHash } from 'node:crypto';

export default function sign(code: string) {
  return `/* @generated(${createHash('sha256')
    .update(code)
    .digest('hex')}) */\n${code}`;
}
