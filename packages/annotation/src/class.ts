import { Annotation } from "./index";
import { BaseAnnotation } from "./base";

export class ClassAnnotation<P extends any[], M extends Annotation> extends BaseAnnotation<P, M> { }