export default class NullBehavior {
  public readonly type = 'null' as const;

  activate() {
    return {
      showCursor: false,
    };
  }

  deactivate() {
    return {
      showCursor: true,
    };
  }
}
