import { Component, ComponentConstructor, Meta as MetaComponent } from "@zille/core";
import { Meta } from "./meta";
import { Annotation } from "@zille/annotation";

export type ServiceConstructor<T extends Service = Service> = {
  new(meta?: Meta<T>, store?: Map<any, any>): T,
  readonly scope: symbol;
};

export class Service {
  static readonly scope = Symbol('SERVICE');
  public readonly meta: Meta<this>;
  constructor(meta: any, public readonly store: Map<any, any>) {
    this.meta = meta;
  }

  static readonly Injectable = Annotation.createClassDecorator(
    'injectable', () => new Meta(),
    anno => anno.meta.creator = anno.target,
  )

  static readonly Inject = Annotation.createPropertyDecorator<[ServiceConstructor | ComponentConstructor], Meta>(
    'inject', () => new Meta(),
    anno => {
      const self = anno.meta;
      const clazz = anno.parameters[0];
      const target = clazz.scope === Component.scope
        ? MetaComponent.instance(clazz as ComponentConstructor)
        : clazz.scope === Service.scope
          ? Meta.instance(clazz as ServiceConstructor)
          : null;

      if (!target) {
        throw new TypeError('Unspecified dependency injection');
      }

      self.injects.set(anno.property, target);
    }
  )

  static readonly InjectStore = Annotation.createPropertyDecorator<[any], Meta>(
    'inject', () => new Meta(),
    anno => {
      const self = anno.meta;
      const name = anno.parameters[0];
      self.injects.set(anno.property, name);
    }
  )

  public async use<T extends Service>(clazz: ServiceConstructor<T>) {
    const target = Meta.instance(clazz);
    const res = await target.create(this.store);
    this.store.set(target, res);
    return res;
  }

  public useStore<T = any>(key: any): T {
    if (!this.store.has(key)) {
      throw new TypeError('Unspecified dependency injection');
    }
    return this.store.get(key);
  }
}