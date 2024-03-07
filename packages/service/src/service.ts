import { Inject, Injectable, Context } from "@zille/core";

export class Service {
  static readonly Inject = Inject;
  private readonly __CLAZZ__: Function;
  constructor(public readonly $ctx: Context) { }

  static Injectable(): ClassDecorator {
    return Injectable(async (object: Service, _: Context, clazz: Function) => {
      Object.defineProperty(object, '__CLAZZ__', {
        get: () => clazz,
      })
    });
  }

  public async $use<T>(clazz: { new(...args: any[]): T }): Promise<T> {
    const res = await this.$ctx.connect(clazz);
    if (this.__CLAZZ__ && res instanceof Service) {
      this.$ctx.addDependency(this.__CLAZZ__, clazz);
    }
    return res;
  }
}