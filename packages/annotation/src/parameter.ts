import { Annotation } from "./index";
import { BaseAnnotation } from "./base";

export class ParamterAnnotation<P extends any[], M extends Annotation, T = any> extends BaseAnnotation<P, M> {
  constructor(
    meta: M, target: any, parameters: P,
    public readonly property: string | symbol,
    public readonly index: number,
    public readonly transform: (anno: ParamterAnnotation<P, M, T>, context: T) => unknown,
  ) {
    super(meta, target, parameters);
  }
}