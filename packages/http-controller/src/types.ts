import { Hook } from "./hook";
export const hook = new Hook();
export interface Newable<T = any> {
  new(...args: any[]): T
}