import { Meta } from './meta';
import { Service, ServiceConstructor } from './service';

export * from './meta';
export * from './service';

export const container = new Map();
export function getService<T extends Service>(clazz: ServiceConstructor<T>, store?: Map<any, any>) {
  const meta = Meta.instance(clazz);
  if (store) {
    for (const [key, value] of container.entries()) {
      if (!store.has(key)) {
        store.set(key, value);
      }
    }
  }
  return meta.create(store);
}