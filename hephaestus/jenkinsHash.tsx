const toUtf8 = (str: string) => {
  const result = [];
  const length = str.length;
  for (let i = 0; i < length; i++) {
    let charcode = str.charCodeAt(i);
    if (charcode < 0x80) {
      result.push(charcode);
    } else if (charcode < 0x8_00) {
      result.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd8_00 || charcode >= 0xe0_00) {
      result.push(
        0xe0 | (charcode >> 12),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f),
      );
    } else {
      i++;
      charcode =
        0x1_00_00 +
        (((charcode & 0x3_ff) << 10) | (str.charCodeAt(i) & 0x3_ff));
      result.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f),
      );
    }
  }
  return result;
};

const _jenkinsHash = (str: string): number => {
  if (!str) {
    return 0;
  }

  const utf8 = toUtf8(str);
  let hash = 0;
  const length = utf8.length;
  for (let i = 0; i < length; i++) {
    hash += utf8[i];
    hash = (hash + (hash << 10)) >>> 0;
    hash ^= hash >>> 6;
  }

  hash = (hash + (hash << 3)) >>> 0;
  hash ^= hash >>> 11;
  hash = (hash + (hash << 15)) >>> 0;
  return hash;
};

const BaseNSymbols =
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const uintToBaseN = (number: number, base: number) => {
  if (base < 2 || base > 62 || number < 0) {
    return '';
  }
  let output = '';
  do {
    output = BaseNSymbols[number % base].concat(output);
    number = Math.floor(number / base);
  } while (number > 0);
  return output;
};

export default function jenkinsHash(text: string): string {
  return uintToBaseN(_jenkinsHash(text), 62);
}
