import 'reflect-metadata';
import { NS_INJECTABLE, container } from './utils';
import { EventEmitter } from 'node:events';

export class Context extends EventEmitter {
  public readonly cache = new Map<Function | string | symbol, any>();
  public readonly dependencies = new Map<Function, Set<Function>>();
  public readonly rollbacks = new Map<Function, () => unknown>();

  constructor() {
    super();
    this.setMaxListeners(+Infinity);
  }

  public addCache(key: any, value: any) {
    this.cache.set(key, value);
    return this
  }

  public getCache<T = any>(key: any): T {
    return this.cache.get(key);
  }

  public addDependency(source: Function, target: Function) {
    if (!this.dependencies.has(source)) {
      this.dependencies.set(source, new Set());
    }
    this.dependencies.get(source).add(target);
    return this;
  }

  public delDependency(source: Function, target: Function) {
    if (this.dependencies.has(source)) {
      const current = this.dependencies.get(source);
      if (current.has(target)) {
        current.delete(target);
        if (!current.size) {
          this.dependencies.delete(source);
        }
      }
    }
    return this;
  }

  public async connect<T>(clazz: { new(...args: any[]): T } | string | symbol): Promise<T> {
    if (this.cache.has(clazz)) {
      return this.cache.get(clazz);
    }

    if (typeof clazz === 'function') {
      if (!Reflect.hasMetadata(NS_INJECTABLE, clazz)) {
        throw new Error('Missing Injectable decorator')
      }

      const object = new clazz(this);
      const callback = Reflect.getMetadata(NS_INJECTABLE, clazz);

      // save it
      this.cache.set(clazz, object);
      this.emit('cache', object, clazz);

      await this.load(clazz, object);
      if (typeof callback === 'function') {
        const rollback = await Promise.resolve(callback(object, this, clazz));
        if (typeof rollback === 'function') {
          // this.rollbacks.set(clazz, rollback);
          this.emit('rollback', object, clazz, rollback);
        }
      }

      return object;
    }
  }

  private async load(clazz: Function, object: any) {
    const target = Object.getPrototypeOf(clazz);
    if (Reflect.hasMetadata(NS_INJECTABLE, target)) {
      await this.load(target, object);
    }
    if (container.has(clazz)) {
      const properties = container.get(clazz);
      for (const key of properties.values()) {
        if (Reflect.hasMetadata(key, object)) {
          const dep = Reflect.getMetadata(key, object);
          if (dep) {
            object[key] = await this.connect(dep);
            // this.addDependency(clazz, dep);
            this.emit('dependency', object, clazz, object[key], dep);
          }
        }
      }
    }
  }

  public async disconnect(clazz: Function) {
    if (this.rollbacks.has(clazz)) {
      const rollback = this.rollbacks.get(clazz);
      await Promise.resolve(rollback());
      this.rollbacks.delete(clazz);
    }
    if (this.cache.has(clazz)) {
      this.cache.delete(clazz);
    }
    if (this.dependencies.has(clazz)) {
      this.dependencies.delete(clazz);
    }
    return this;
  }

  public async destroy(clazz: Function) {
    if (this.dependencies.has(clazz)) {
      const current = this.dependencies.get(clazz);
      for (const dependency of current.values()) {
        await this.destroy(dependency);
      }
    }
    await this.disconnect(clazz);
    return this;
  }
}