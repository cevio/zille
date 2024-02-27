import 'reflect-metadata';
import { EventEmitter } from 'node:events';
import { ClassAnnotation } from "./class";
import { MethodAnnotation } from "./method";
import { ParamterAnnotation } from "./parameter";
import { PropertyAnnotation } from "./property";

export * from './base';
export * from './class';
export * from './method';
export * from './parameter';
export * from './property';

export interface Newable<T = any> {
  new(...args: any[]): T,
}

export class Annotation extends EventEmitter {
  static readonly namespace = Symbol('META');
  public readonly classes = new Map<any, ClassAnnotation<any[], any>>();
  public readonly methods = new Map<string | symbol, Map<any, PropertyAnnotation<any[], any>>>();
  public readonly properties = new Map<string | symbol, Map<any, PropertyAnnotation<any[], any>>>();
  public readonly parameters = new Map<string | symbol, ParamterAnnotation<any[], any>[][]>();

  constructor() {
    super();
    this.setMaxListeners(+Infinity);
  }

  public async executeParamters<T>(property: string | symbol, context: T) {
    if (!this.parameters.has(property)) return [];
    const parameters = this.parameters.get(property);
    const result: any[] = [];

    for (let i = 0; i < parameters.length; i++) {
      const parameter = parameters[i];
      if (!parameter) continue;
      let value: any = context;

      for (let j = 0; j < parameter.length; j++) {
        const annotation = parameter[j];
        value = await Promise.resolve(annotation.transform(annotation, value));
      }

      result[i] = value;
    }

    return result;
  }

  static getInstance<T extends Annotation>(clazz: Newable, maker: () => T): T {
    if (!Reflect.hasMetadata(Annotation.namespace, clazz)) {
      Reflect.defineMetadata(Annotation.namespace, maker(), clazz);
    }
    return Reflect.getMetadata(Annotation.namespace, clazz);
  }

  static createClassDecorator<P extends any[], M extends Annotation>(
    namespace: any, maker: () => M,
    callback?: (anno: ClassAnnotation<P, M>) => unknown
  ) {
    return (...args: P): ClassDecorator => {
      return (target: any) => {
        const meta = Annotation.getInstance(target, maker);
        let annotation: ClassAnnotation<P, M>;
        if (meta.classes.has(namespace)) {
          annotation = meta.classes.get(namespace) as ClassAnnotation<P, M>;
          annotation.parameters.unshift(...args);
        } else {
          annotation = new ClassAnnotation(meta, target, args);
          meta.classes.set(namespace, annotation);
        }
        if (typeof callback === 'function') {
          callback(annotation);
        }
      }
    }
  }

  static createMethodDecorator<P extends any[], M extends Annotation>(
    namespace: any, maker: () => M,
    callback?: (anno: MethodAnnotation<P, M>) => unknown
  ) {
    return (...args: P): MethodDecorator => {
      return (target, property, descriptor) => {
        const ctor = target.constructor as Newable;
        const meta = Annotation.getInstance(ctor, maker);

        type IAnnotions = Map<any, MethodAnnotation<P, M>>;

        let annotations: IAnnotions;
        let annotation: MethodAnnotation<P, M>;

        if (meta.properties.has(property)) {
          annotations = meta.properties.get(namespace) as IAnnotions;
        } else {
          annotations = new Map();
          meta.properties.set(property, annotations);
        }

        if (annotations.has(namespace)) {
          annotation = annotations.get(namespace);
          annotation.parameters.unshift(...args);
        } else {
          annotation = new MethodAnnotation(meta, ctor, args, property, descriptor);
          annotations.set(namespace, annotation);
        }

        if (typeof callback === 'function') {
          callback(annotation);
        }
      }
    }
  }

  static createPropertyDecorator<P extends any[], M extends Annotation>(
    namespace: any, maker: () => M,
    callback?: (anno: PropertyAnnotation<P, M>) => unknown
  ) {
    return (...args: P): PropertyDecorator => {
      return (target, property) => {
        const ctor = target.constructor as Newable;
        const meta = Annotation.getInstance(ctor, maker);

        type IAnnotions = Map<any, PropertyAnnotation<P, M>>;

        let annotations: IAnnotions;
        let annotation: PropertyAnnotation<P, M>;

        if (meta.properties.has(property)) {
          annotations = meta.properties.get(namespace) as IAnnotions;
        } else {
          annotations = new Map();
          meta.properties.set(property, annotations);
        }

        if (annotations.has(namespace)) {
          annotation = annotations.get(namespace);
          annotation.parameters.unshift(...args);
        } else {
          annotation = new PropertyAnnotation(meta, ctor, args, property);
          annotations.set(namespace, annotation);
        }

        if (typeof callback === 'function') {
          callback(annotation);
        }
      }
    }
  }

  static createParameterDecorator<P extends any[], M extends Annotation, T = any>(
    maker: () => M,
    callback: (anno: ParamterAnnotation<P, M, T>, context: T) => unknown
  ) {
    return (...args: P): ParameterDecorator => {
      return (target, property, index) => {
        const ctor = target.constructor as Newable;
        const meta = Annotation.getInstance(ctor, maker);

        if (!meta.parameters.has(property)) {
          meta.parameters.set(property, []);
        }

        const positions = meta.parameters.get(property);

        if (!positions[index]) {
          positions[index] = [];
        }

        const annotation = new ParamterAnnotation(meta, ctor, args, property, index, callback);

        positions[index].unshift(annotation);
      }
    }
  }
}