import 'reflect-metadata';

export function createClassDecorator<P extends any[] = []>(name: string | symbol, callback?: (target: Function, ...args: P) => unknown) {
  return (...args: P): ClassDecorator => {
    return target => {
      if (!Reflect.hasMetadata(name, target)) {
        Reflect.defineMetadata(name, [], target);
      }
      const current: P = Reflect.getMetadata(name, target);
      current.unshift(...args);
      if (typeof callback === 'function') {
        callback(target, ...current);
      }
    }
  }
}

export function createParameterDecorator<T = any, P extends any[] = []>(callback: (ctx: T, ...args: P) => unknown) {
  return (...args: P): ParameterDecorator => {
    return (target, property, index) => {
      if (!Reflect.hasMetadata(property, target)) {
        Reflect.defineMetadata(property, [], target);
      }
      const current = Reflect.getMetadata(property, target);
      current[index] = {
        parameters: args,
        callback,
      }
    }
  }
}

export async function executeParameters<T>(ctx: T, target: Object, property: string | symbol) {
  if (!Reflect.hasMetadata(property, target)) return [];
  const current: { parameters: any[], callback: (ctx: T, ...args: any[]) => unknown }[] = Reflect.getMetadata(property, target);
  const res: any[] = [];
  for (let i = 0; i < current.length; i++) {
    const { parameters, callback } = current[i];
    res[i] = await Promise.resolve(callback(ctx, ...parameters));
  }
  return res;
}

export function getClassDecorator(name: string | symbol, target: Function) {
  if (!Reflect.hasMetadata(name, target)) return [];
  const parameters = Reflect.getMetadata(name, target) as any[];
  return parameters;
}