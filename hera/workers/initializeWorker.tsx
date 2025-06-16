declare global {
  var $RefreshReg$: () => void;
  var $RefreshSig$: (type: string) => (type: string) => string;
}

if (import.meta.hot) {
  self.window = self;
  self.$RefreshReg$ = () => {};
  // eslint-disable-next-line unicorn/consistent-function-scoping
  self.$RefreshSig$ = () => (type) => type;
}
