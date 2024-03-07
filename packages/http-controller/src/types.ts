import { HTTPMethod } from "find-my-way";
import { Hook } from "./hook";
import { Middleware } from "koa";
export const hook = new Hook();
export interface Newable<T = any> {
  new(...args: any[]): T
}
export interface IControllerLoadingMeta {
  methods: HTTPMethod[],
  middlewares: Middleware[],
  physicalPath: string,
  routingPath: string,
}