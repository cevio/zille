import { Context } from "@zille/core";
import { Application } from './application';
export const container = new Context();
export * from './application';

container.on('rollback', (object: any, clazz: Function, rollback: any) => {
  if (object instanceof Application) {
    container.rollbacks.set(clazz, rollback);
  }
})

container.on('dependency', (object: any, clazz: Function, obj: any, dep: Function) => {
  if (object instanceof Application && obj instanceof Application) {
    container.addDependency(clazz, dep);
  }
})