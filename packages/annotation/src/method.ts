import { Annotation } from "./index";
import { BaseAnnotation } from "./base";

export class MethodAnnotation<P extends any[], M extends Annotation> extends BaseAnnotation<P, M> {
  constructor(
    meta: M, target: any, parameters: P,
    public readonly property: string | symbol,
    public readonly descriptor: TypedPropertyDescriptor<any>
  ) {
    super(meta, target, parameters);
  }
}