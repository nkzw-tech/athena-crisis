import traverse, { Node, NodePath, Scope, TraverseOptions } from '@babel/traverse';

type TraverseFn = (
  parent: Node,
  opts?: TraverseOptions,
  scope?: Scope,
  state?: unknown,
  parentPath?: NodePath,
) => void;

export default ((traverse as unknown as { default: typeof traverse }).default ||
  traverse) as unknown as TraverseFn;
