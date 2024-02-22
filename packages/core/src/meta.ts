import 'reflect-metadata';
import { NAMESPACE_META } from './variable';
import { Node } from './node';
import { Annotation } from '@zille/annotation';
import { Component, ComponentConstructor } from './component';

export class Meta<T extends Component = Component> extends Node {
  static readonly scope = Symbol(NAMESPACE_META);
  public readonly state = new Map();
  public readonly injects = new Map<string | symbol, Meta>();
  public readonly dependencies = new Set<Meta>();
  public readonly dependents = new Set<Meta>();
  public readonly rollbacks = new Map<Meta, () => void>();
  public context: T;
  public creator: ComponentConstructor<T>;

  static instance<T extends Component = Component>(clazz: ComponentConstructor<T>): Meta<T> {
    return Annotation.getInstance(clazz, () => new Meta());
  }

  private async runWithRollback(callback: (add: (rollback: () => unknown | Promise<unknown>) => number) => Promise<unknown>) {
    const rollbacks: (() => unknown | Promise<unknown>)[] = [];
    const add = (rollback: () => unknown | Promise<unknown>) => rollbacks.push(rollback);
    try {
      await callback(add);
    } catch (e) {
      let i = rollbacks.length;
      while (i--) {
        await Promise.resolve(rollbacks[i]());
      }
      throw e;
    }
  }

  public async initialize() {
    this.context = new this.creator(this);
    const dependencies = Array.from(this.injects.entries()).map(([key, meta]) => {
      return meta.setup().then(() => {
        // @ts-ignore
        this.context[key] = meta.context;
      })
    })
    await Promise.all(dependencies);
    await this.runWithRollback(add =>
      Promise.resolve(this.context.initialize(add))
    );
  }

  public async terminate() {
    await this.runWithRollback(add =>
      Promise.resolve(this.context.terminate(add))
    );
    for (const rollback of this.rollbacks.values()) {
      rollback();
    }
    this.rollbacks.clear();
    this.state.clear();
    this.context = null;
  }
}