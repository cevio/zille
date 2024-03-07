import { container, Application } from '@zille/application';
import { Context } from '@zille/core';
import { Service } from './service';
export * from './service';

export function createContext() {
  const ctx = new Context();
  for (const [key, value] of container.cache.entries()) {
    ctx.cache.set(key, value);
  }
  ctx.on('cache', (object: any, clazz: Function) => {
    if (object instanceof Application) {
      container.cache.set(clazz, object);
    }
  })
  ctx.on('rollback', (object: any, clazz: Function, rollback: any) => {
    if (object instanceof Application) {
      container.rollbacks.set(clazz, rollback);
    }
  })
  ctx.on('dependency', (object: any, clazz: Function, obj: any, dep: Function) => {
    if (object instanceof Application && obj instanceof Application) {
      container.addDependency(clazz, dep);
    } else if (obj instanceof Service && object instanceof Service) {
      ctx.addDependency(clazz, dep);
    }
  })
  return ctx;
}