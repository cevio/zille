import { Meta } from './meta';
import { Service, ServiceConstructor } from './service';

export * from './meta';
export * from './service';

export function getMeta<T extends Service>(clazz: ServiceConstructor<T>) {
  return Meta.instance(clazz);
}

export function getService<T extends Service>(clazz: ServiceConstructor<T>, injections?: Record<any, any>) {
  const meta = getMeta(clazz);
  let store = new Map();
  if (injections) {
    const keys = Object.keys(injections);
    if (keys.length) {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = injections[key];
        store.set(key, value);
      }
    }
  }
  return meta.create(store);
}