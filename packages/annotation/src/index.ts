import 'reflect-metadata';
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

export class Annotation {
  static readonly namespace = Symbol('META');
  public readonly classes = new Map<any, ClassAnnotation<any[], any>>();
  public readonly methods = new Map<string | symbol, Map<any, MethodAnnotation<any[], any>>>();
  public readonly properties = new Map<string | symbol, Map<any, PropertyAnnotation<any[], any>>>();
  public readonly parameters = new Map<string | symbol, Map<any, ParamterAnnotation<any[], any>>[]>();

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

        if (meta.methods.has(property)) {
          annotations = meta.methods.get(property) as IAnnotions;
        } else {
          annotations = new Map();
          meta.methods.set(property, annotations);
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

  static createParameterDecorator<P extends any[], M extends Annotation>(
    namespace: any, maker: () => M,
    callback?: (anno: ParamterAnnotation<P, M>) => unknown
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
          positions[index] = new Map();
        }

        let annotation: ParamterAnnotation<P, M>;
        const annotations = positions[index] as Map<any, ParamterAnnotation<P, M>>;
        if (annotations.has(namespace)) {
          annotation = annotations.get(namespace);
          annotation.parameters.unshift(...args);
        } else {
          annotation = new ParamterAnnotation(meta, ctor, args, property, index);
          annotations.set(namespace, annotation);
        }

        if (typeof callback === 'function') {
          callback(annotation);
        }
      }
    }
  }
}