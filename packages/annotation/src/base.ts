import { Annotation } from "./index";

export class BaseAnnotation<P extends any[], M extends Annotation> {
  constructor(
    public readonly meta: M,
    public readonly target: any,
    public readonly parameters: P,
  ) { }
}