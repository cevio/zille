import { Annotation } from "./index";
import { BaseAnnotation } from "./base";

export class ParamterAnnotation<P extends any[], M extends Annotation> extends BaseAnnotation<P, M> {
  constructor(
    meta: M, target: any, parameters: P,
    public readonly property: string | symbol,
    public readonly index: number,
  ) {
    super(meta, target, parameters);
  }
}