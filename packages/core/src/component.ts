import { Meta } from "./meta";
import { ERROR_DUPLICATE, NAMESPACE_COMPONENT } from "./variable";
import { Annotation } from '@zille/annotation';

export interface ComponentConstructor<T extends Component = Component> {
  new(meta?: Meta<T>): T,
  readonly scope: symbol,
};

export abstract class Component {
  static readonly scope = Symbol(NAMESPACE_COMPONENT);
  public readonly meta: Meta<this>;
  public abstract initialize(add: (rollback: () => unknown) => number): void | Promise<void>;
  public abstract terminate(add: (rollback: () => unknown) => number): void | Promise<void>;

  static readonly Injectable = Annotation.createClassDecorator(
    'injectable', () => new Meta(),
    anno => anno.meta.creator = anno.target,
  )

  static readonly Inject = Annotation.createPropertyDecorator<[ComponentConstructor], Meta<Component>>(
    'inject', () => new Meta(),
    anno => {
      const self = anno.meta;
      const target = Meta.instance(anno.parameters[0]);
      if (self.dependents.has(target)) {
        throw ERROR_DUPLICATE;
      }
      self.injects.set(anno.property, target);
      self.dependencies.add(target);
      target.dependents.add(self);
    }
  )

  constructor(meta: any) {
    this.meta = meta;
  }

  public async use<T extends Component>(clazz: ComponentConstructor<T>) {
    const instance = Meta.instance(clazz);
    if (this.meta.dependents.has(instance)) {
      throw ERROR_DUPLICATE;
    }
    await instance.setup();
    if (!this.meta.rollbacks.has(instance)) {
      this.meta.dependencies.add(instance);
      instance.dependents.add(this.meta);
      this.meta.rollbacks.set(instance, () => {
        const propertyMetas = Array.from(this.meta.injects.values());
        if (!propertyMetas.includes(instance)) {
          if (this.meta.dependencies.has(instance)) {
            this.meta.dependencies.delete(instance);
          }
          if (instance.dependents.has(this.meta)) {
            instance.dependents.delete(this.meta);
          }
        }
      })
    }
    return instance.context;
  }

  public setState(key: any, value: any) {
    this.meta.state.set(key, value);
  }

  public getState<T = any>(key: any) {
    return this.meta.state.get(key) as T;
  }

  public hasState(key: any) {
    return this.meta.state.has(key);
  }

  public delState(key: any) {
    return this.meta.state.delete(key);
  }
}