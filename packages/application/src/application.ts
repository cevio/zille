import { Context, Inject, Injectable } from '@zille/core';
import { container } from '.';

export abstract class Application {
  static readonly Inject = Inject;
  constructor(public readonly $ctx: Context) { }
  private readonly __CLAZZ__: Function;
  public abstract setup(): unknown;
  public async $use<T>(clazz: { new(...args: any[]): T }): Promise<T> {
    const res = await this.$ctx.connect(clazz);
    if (this.__CLAZZ__) {
      this.$ctx.addDependency(this.__CLAZZ__, clazz);
    }
    return res;
  }

  static Injectable(): ClassDecorator {
    return Injectable(async (object: Application, _: Context, clazz: Function) => {
      Object.defineProperty(object, '__CLAZZ__', {
        get: () => clazz,
      })
      const res = await Promise.resolve(object.setup());
      return res;
    });
  }
}