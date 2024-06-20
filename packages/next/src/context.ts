import { NS, container } from "./decroators";
import { IClass, IHookCallback, InjectAcceptType } from './types';

export class Component {
  constructor(public readonly ctx: Context) { }

  public use<R extends Component, T extends InjectAcceptType<R>>(clazz: T) {
    return this.ctx.use<R, T>(clazz);
  }

  public hook(key: string, callback: IHookCallback) {
    this.ctx.hook(key, callback);
    return this;
  }
}

export class Context extends Map {
  private readonly cache = new Map<InjectAcceptType, any>();
  private readonly pending = new Map<Function, Array<[(value: unknown) => void, (reason?: any) => void]>>();
  private readonly hooks = new Map<string | symbol, IHookCallback>();

  public hook(key: string | symbol, callback: IHookCallback) {
    this.hooks.set(key, callback);
    return this;
  }

  public use<R extends Component, T extends InjectAcceptType<R>>(clazz: T): Promise<T extends IClass<infer U> ? U : R> {
    if (this.cache.has(clazz)) return this.cache.get(clazz);
    if (typeof clazz !== 'function') {
      if (!this.hooks.has(clazz)) {
        throw new Error('Invalid hook name `' + clazz.toString() + '`, you should provide it as a hook first.')
      }
      const callback = this.hooks.get(clazz);
      return Promise.resolve(callback(this)).then(res => {
        this.cache.set(clazz, res);
        return res;
      });
    }

    if (this.pending.has(clazz)) {
      // 加入到等待队列
      const pending = this.pending.get(clazz);
      return new Promise((resolve, reject) => {
        pending.push([resolve, reject]);
      })
    } else {
      this.pending.set(clazz, []);
      const pending = this.pending.get(clazz);
      return new Promise((resolve, reject) => {
        this.load(clazz)
          .then(async ({ callbacks, injections }) => {
            // 实例化
            // @ts-ignore
            const current = new clazz(this);

            // 循环注入依赖
            for (let i = 0; i < injections.length; i++) {
              const { key, value } = injections[i];
              current[key] = value;
            }

            // 执行 injectable 方法
            for (let i = 0; i < callbacks.length; i++) {
              const callback = callbacks[i];
              await Promise.resolve(callback(current));
            }

            return current;
          })

          // 处理其他等待的依赖
          .then(result => {
            for (let i = 0; i < pending.length; i++) {
              const [_resolve] = pending[i];
              _resolve(result);
            }
            resolve(result);
            this.cache.set(clazz, result);
          })

          // 容错处理
          .catch(e => {
            for (let i = 0; i < pending.length; i++) {
              const [, _reject] = pending[i];
              _reject(e);
            }
            reject(e);
          })
          .finally(() => this.pending.delete(clazz));
      })
    }
  }

  /**
   * load callbacks and injections
   * @param clazz 
   * @returns 
   */
  private async load(clazz: Function) {
    const target = Object.getPrototypeOf(clazz);
    type IProperty = {
      callbacks: Function[],
      injections: { key: string | symbol, value: any }[],
    }
    const properties: IProperty = {
      callbacks: [],
      injections: [],
    };
    if (target && container.has(target)) {
      const { callbacks, injections } = await this.load(target);
      properties.injections.push(...injections);
      properties.callbacks.push(...callbacks);
    }
    if (container.has(clazz)) {
      const meta = container.get(clazz);
      if (meta.has(NS.INJECT)) {
        const child: Map<string | symbol, InjectAcceptType> = meta.get(NS.INJECT);
        for (const [key, value] of child.entries()) {
          const result = await this.use(value);
          properties.injections.push({ key, value: result });
        }
      }
      if (meta.has(NS.INJECTABLE)) {
        const callback = meta.get(NS.INJECTABLE);
        if (typeof callback === 'function') {
          properties.callbacks.push(callback);
        }
      }
    }
    return properties;
  }

  public eachCache(callback: (value: any, key?: InjectAcceptType) => unknown) {
    for (const [key, value] of this.cache.entries()) {
      callback(value, key);
    }
  }

  public eachHook(callback: (value: (ctx: this) => any | Promise<any>, key?: string | symbol) => unknown) {
    for (const [key, value] of this.hooks.entries()) {
      callback(value, key);
    }
  }

  public addCache(key: InjectAcceptType, value: any) {
    this.cache.set(key, value);
    return this;
  }

  public hasCache(key: InjectAcceptType) {
    return this.cache.has(key);
  }

  public addHook(key: string | symbol, value: (ctx: this) => unknown | Promise<unknown>) {
    this.hooks.set(key, value);
    return this;
  }

  public hasHook(key: string | symbol) {
    return this.hooks.has(key);
  }

  public mergeTo(ctx: Context) {
    this.eachCache((value, key) => {
      if (!ctx.hasCache(key)) {
        ctx.addCache(key, value);
      }
    })
    this.eachHook((value, key) => {
      if (!ctx.hasHook(key)) {
        ctx.addHook(key, value);
      }
    })
  }

  public mergeFrom(ctx: Context) {
    ctx.eachCache((value, key) => {
      if (!this.hasCache(key)) {
        this.addCache(key, value);
      }
    })
    ctx.eachHook((value, key) => {
      if (!this.hasHook(key)) {
        this.addHook(key, value);
      }
    })
  }
}