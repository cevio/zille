import { MatchFunction, PathFunction } from "path-to-regexp";
import { IControllerLoadingMeta } from "./types";

export class Hook {
  private readonly stacks = new Map<Function, {
    toPath: PathFunction<object>,
    toMatch: MatchFunction<object>,
    created: Set<(options: IControllerLoadingMeta) => unknown>,
    mounted: Set<(options: IControllerLoadingMeta) => unknown>,
  }>();

  public add(clazz: Function) {
    if (!this.stacks.has(clazz)) {
      this.stacks.set(clazz, {
        toMatch: null,
        toPath: null,
        created: new Set(),
        mounted: new Set(),
      })
    }
    return this.stacks.get(clazz);
  }

  public addPath(clazz: Function, fn: PathFunction<object>) {
    const target = this.add(clazz);
    target.toPath = fn;
    return this;
  }

  public addMatch(clazz: Function, fn: MatchFunction<object>) {
    const target = this.add(clazz);
    target.toMatch = fn;
    return this;
  }

  public getPath(clazz: Function) {
    const target = this.add(clazz);
    return target.toPath;
  }

  public getMatch(clazz: Function) {
    const target = this.add(clazz);
    return target.toMatch;
  }

  public onCreate(clazz: Function, fn: (options: IControllerLoadingMeta) => unknown) {
    const target = this.add(clazz);
    target.created.add(fn);
    return this;
  }

  public onMount(clazz: Function, fn: (options: IControllerLoadingMeta) => unknown) {
    const target = this.add(clazz);
    target.mounted.add(fn);
    return this;
  }

  public created(clazz: Function, options: IControllerLoadingMeta) {
    if (this.stacks.has(clazz)) {
      const events = this.stacks.get(clazz).created;
      for (const fn of events.values()) {
        fn(options);
      }
    }
    return this;
  }

  public mounted(clazz: Function, options: IControllerLoadingMeta) {
    if (this.stacks.has(clazz)) {
      const events = this.stacks.get(clazz).mounted;
      for (const fn of events.values()) {
        fn(options);
      }
    }
    return this;
  }
}