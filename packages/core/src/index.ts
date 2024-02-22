import { Component, ComponentConstructor } from "./component";
import { Meta } from "./meta";

export * from './component';
export * from './meta';

export function getMeta<T extends Component>(clazz: ComponentConstructor<T>) {
  return Meta.instance(clazz)
}

export async function create<T extends Component>(clazz: ComponentConstructor<T>) {
  const instance = getMeta(clazz);
  await instance.setup();
  return instance.context;
}

export async function destroy<T extends Component>(target: T) {
  const instance = target.meta;
  await Promise.all(Array.from(instance.dependencies.values()).map(meta => meta.destroy()));
  await instance.destroy();
}

export function destroyClass<T extends Component>(clazz: ComponentConstructor<T>) {
  const instance = getMeta(clazz);
  return destroy(instance.context);
}