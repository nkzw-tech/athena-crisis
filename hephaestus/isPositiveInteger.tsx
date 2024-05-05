export default function isPositiveInteger(number: unknown) {
  return typeof number === 'number' && !Number.isNaN(number) && number > 0;
}
