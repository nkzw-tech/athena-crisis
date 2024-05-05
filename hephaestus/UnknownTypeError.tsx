export default class UnknownTypeError extends Error {
  constructor(name: string, type: string) {
    super(`${name}: Unknown type '${type}'.`);
  }
}
