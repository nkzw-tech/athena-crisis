export default function clipBorder(size = 4, sides: 'all' | 'top' = 'all') {
  const offset = sides === 'all' ? ` - ${size}px` : ``;
  return `clip-path: polygon(
    0 ${size}px,
    ${size}px ${size}px,
    ${size}px 0,
    calc(100% - ${size}px) 0,
    calc(100% - ${size}px) ${size}px,
    100% ${size}px,
    100% calc(100% - ${size}px),
    calc(100%${offset}) calc(100%${offset}),
    calc(100%${offset}) 100%,
    ${size}px 100%,
    ${size}px calc(100%${offset}),
    0 calc(100%${offset})
  );`;
}
