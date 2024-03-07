export const NS_INJECTABLE = Symbol('injectable');
export const container = new Map<Function, Set<string | symbol>>();