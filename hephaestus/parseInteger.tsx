export default function parseInteger(value: string): number | null {
  const number = Number.parseInt(value, 10);
  return Number.isNaN(number) ? null : number;
}
