declare global {
  // eslint-disable-next-line no-var
  var $RefreshReg$: () => void;
  // eslint-disable-next-line no-var
  var $RefreshSig$: (type: string) => (type: string) => string;
}

if (import.meta.hot) {
  self.$RefreshReg$ = () => {};
  // eslint-disable-next-line unicorn/consistent-function-scoping
  self.$RefreshSig$ = () => (type) => type;
}
