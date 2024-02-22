import 'reflect-metadata';
import { Service, ServiceConstructor } from "./service";
import { Meta as MetaComponent } from '@zille/core';
import { Annotation } from '@zille/annotation';

export class Meta<T extends Service = Service> extends Annotation {
  public creator: ServiceConstructor<T>;
  public readonly state = new Map();
  public readonly injects = new Map<string | symbol, Meta | MetaComponent>();
  static readonly scope = Symbol('SERVICE');

  static instance<T extends Service>(clazz: ServiceConstructor<T>): Meta<T> {
    return Annotation.getInstance(clazz, () => new Meta());
  }

  public async create(store?: Map<any, any>) {
    const target = new this.creator(this);
    if (!store) store = new Map();
    for (const [key, instance] of this.injects.entries()) {
      if (instance instanceof MetaComponent) {
        await instance.setup();
        // @ts-ignore
        target[key] = instance.context;
      } else {
        if (store.has(instance)) {
          // @ts-ignore
          target[key] = store.get(instance);
        } else {
          const value = await instance.create(store);
          store.set(instance, value);
          // @ts-ignore
          target[key] = value;
        }
      }
    }
    return target;
  }
}
