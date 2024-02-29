import 'reflect-metadata';
import { Service, ServiceConstructor } from "./service";
import { Meta as MetaComponent } from '@zille/core';
import { Annotation } from '@zille/annotation';

export class Meta<T extends Service = Service> extends Annotation {
  public creator: ServiceConstructor<T>;
  public readonly state = new Map();
  public readonly injects = new Map<string | symbol, any>();
  static readonly scope = Symbol('SERVICE');

  static instance<T extends Service>(clazz: ServiceConstructor<T>): Meta<T> {
    return Annotation.getInstance(clazz, () => new Meta());
  }

  public async create(store?: Map<any, any>) {
    const target = new this.creator(this);
    if (!store) store = new Map();
    for (const [key, instance] of this.injects.entries()) {
      if (store.has(instance)) {
        // @ts-ignore
        target[key] = store.get(instance);
      } else if (instance instanceof MetaComponent) {
        await instance.setup();
        store.set(instance, instance.context);
        // @ts-ignore
        target[key] = instance.context;
      } else if (instance instanceof Meta) {
        const value = await instance.create(store);
        store.set(instance, value);
        // @ts-ignore
        target[key] = value;
      } else {
        throw new Error('Unspecified dependency injection');
      }
    }
    return target;
  }
}