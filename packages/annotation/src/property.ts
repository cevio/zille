import { Annotation } from "./index";
import { BaseAnnotation } from "./base";

export class PropertyAnnotation<P extends any[], M extends Annotation> extends BaseAnnotation<P, M> {
  constructor(
    meta: M, target: any, parameters: P,
    public readonly property: string | symbol,
  ) {
    super(meta, target, parameters);
  }
}