import 'reflect-metadata';
import { container, NS_INJECTABLE } from './utils';

export * from './context';

export function Inject(dep: Function): PropertyDecorator {
  return (target, property) => {
    if (Reflect.hasMetadata(property, target)) {
      throw new Error('Dependencies cannot be defined repeatedly');
    }
    const fn = target.constructor;
    if (!container.has(fn)) container.set(fn, new Set());
    container.get(fn).add(property);
    Reflect.defineMetadata(property, dep, target);
  }
}

export function Injectable(callback?: Function): ClassDecorator {
  return target => {
    Reflect.defineMetadata(NS_INJECTABLE, callback, target);
  }
}